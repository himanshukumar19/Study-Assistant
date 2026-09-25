import { ITEM_TYPES } from "../src/services/schema.js";
import { resolveProviders, headersFor } from "./providers.js";

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

  if (!text || typeof text !== "string" || !text.trim() || text.length > 4000) {
    return res.status(400).json({ error: "Text input is required and must not exceed 4000 characters." });
  }

  if (!mode || !MODE_INSTRUCTIONS[mode]) {
    return res.status(400).json({ error: "Mode must be flashcards, quiz, or mixed." });
  }

  const providers = resolveProviders();

  if (providers.length === 0) {
    return res.status(500).json({
      error: "Server misconfiguration: no AI provider key set (GROQ_API_KEY / GROK_API_KEY / OPENROUTER_API_KEY).",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let lastStatus = 502;
    let lastProvider = null;

    for (const provider of providers) {
      for (const model of provider.models) {
        const response = await fetch(provider.url, {
          method: "POST",
          headers: headersFor(provider),
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT + "\n\n" + MODE_INSTRUCTIONS[mode] },
              { role: "user", content: text },
            ],
            response_format: { type: "json_object" },
            max_tokens: 8192,
            temperature: 0.7,
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;

          if (content) {
            clearTimeout(timeout);
            console.log(`[generate] served by ${provider.id}/${model}`);
            return res.json({ raw: content });
          }

          console.error(`[${provider.id}] empty response body (model=${model})`);
          lastStatus = 502;
          lastProvider = provider.id;
          break;
        }

        lastStatus = response.status;
        lastProvider = provider.id;
        const body = await response.text();
        console.error(`[${provider.id}] ${response.status} (model=${model}): ${body}`);

        // 404 = unknown/discontinued model, 402 = no credit for this model.
        // Anything else (401, 429, 5xx) is not fixed by switching models —
        // move on to the next provider instead.
        if (response.status !== 404 && response.status !== 402) break;
      }
    }

    clearTimeout(timeout);

    return res.status(502).json({
      error: `Upstream error (${lastStatus}).`,
      upstreamStatus: lastStatus,
      provider: lastProvider,
    });
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Provider request timed out." });
    }

    console.error("[generate]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
