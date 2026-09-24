/**
 * Call the backend proxy to generate study items.
 *
 * @param {Object} params
 * @param {string} params.text — user notes/excerpt
 * @param {string} params.mode — "flashcards" | "quiz" | "mixed"
 * @param {AbortSignal} [params.signal] — optional abort signal
 * @returns {Promise<string>} raw JSON string from the provider
 */
export async function generateStudySet({ text, mode, signal }) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${res.status}).`);
  }

  const data = await res.json();
  return data.raw;
}
