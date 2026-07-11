import { ITEM_TYPES } from "../src/services/schema.js";

const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_MODEL = "gpt-oss-120b";
const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You are a study-material generator. Given user-provided notes or text, generate interactive study items.

Return ONLY a JSON object with this exact shape — no markdown fences, no prose, no explanation:
{
  "items": [
    {
      "id": "string",
      "type": "flashcard",
      "front": "string",
      "back": "string"
    },
    {
      "id": "string",
      "type": "quiz",
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}

Rules:
- Each item has "type": ${JSON.stringify(ITEM_TYPES)}.
- Flashcards: concise front (concept/question) and back (answer/explanation).
- Quiz: exactly 4 options, correctIndex 0-3, short explanation.
- Generate 5-15 items depending on input length.
- Use the same language as the input.
- IDs: use sequential strings like "1", "2", "3".`;

const MODE_INSTRUCTIONS = {
  flashcards: "Generate only flashcard items (type: \"flashcard\").",
  quiz: "Generate only quiz items (type: \"quiz\").",
  mixed: "Generate exactly 5 flashcard items AND 5 quiz items — both types must be present. Never produce only one type.",
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function generateHandler(req, res) {
  const { text, mode } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text input is required." });
  }

  if (!mode || !MODE_INSTRUCTIONS[mode]) {
    return res.status(400).json({ error: "Mode must be flashcards, quiz, or mixed." });
  }

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfiguration: missing API key." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CEREBRAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\n" + MODE_INSTRUCTIONS[mode] },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      console.error(`[cerebras] ${response.status}: ${body}`);
      return res.status(502).json({
        error: `Upstream error (${response.status}).`,
        upstreamStatus: response.status,
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: "Empty response from provider." });
    }

    return res.json({ raw: content });
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Provider request timed out." });
    }

    console.error("[generate]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
