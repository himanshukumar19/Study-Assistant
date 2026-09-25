/**
 * AI provider chain.
 *
 * Order of preference: the first provider whose key is present in the
 * environment wins. If a key's prefix identifies a provider (Groq keys start
 * with `gsk_`, xAI/Grok keys with `xai-`), that provider is tried first even if
 * its env var name is ambiguous — so a single `GROK_API_KEY` or `GROQ_API_KEY`
 * entry works whichever service it belongs to.
 *
 * Keys never leave the backend.
 */

/** @typedef {{ id: string, url: string, envKeys: string[], keyPrefixes: string[], models: string[] }} Provider */

/** @type {Provider[]} */
export const PROVIDERS = [
  {
    id: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    envKeys: ["GROQ_API_KEY", "GROK_API_KEY"],
    keyPrefixes: ["gsk_"],
    // Llama 3.3 was retired from Groq's free tier; gpt-oss-120b is the current
    // flagship there, with qwen3.8-27b as a second attempt.
    models: [
      process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      "qwen/qwen3.8-27b",
    ],
  },
  {
    id: "xai",
    url: "https://api.x.ai/v1/chat/completions",
    envKeys: ["XAI_API_KEY", "GROK_API_KEY"],
    keyPrefixes: ["xai-"],
    models: [process.env.XAI_MODEL || "grok-3-mini"],
  },
  {
    id: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    envKeys: ["OPENROUTER_API_KEY"],
    keyPrefixes: [],
    models: [process.env.OPENROUTER_MODEL || "openrouter/auto", "meta-llama/llama-3.3-70b-instruct"],
  },
];

/**
 * Pick a key for a provider, preferring an env var whose name matches the
 * provider (GROQ_API_KEY over GROK_API_KEY for Groq, and vice versa for xAI).
 * @param {Provider} provider
 * @returns {string|null}
 */
function readKey(provider) {
  for (const name of provider.envKeys) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Resolve the provider chain for this process: providers with a key, ordered
 * so that prefix-matched providers come first.
 * @returns {Array<Provider & { key: string }>}
 */
export function resolveProviders() {
  const available = [];

  for (const provider of PROVIDERS) {
    const key = readKey(provider);
    if (key) available.push({ ...provider, key });
  }

  const matched = available.filter((p) => p.keyPrefixes.some((prefix) => p.key.startsWith(prefix)));
  const unmatched = available.filter((p) => !p.keyPrefixes.some((prefix) => p.key.startsWith(prefix)));

  return [...matched, ...unmatched];
}

/** @param {Provider} provider */
export function headersFor(provider) {
  const base = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.key}`,
  };

  if (provider.id === "openrouter") {
    return {
      ...base,
      "HTTP-Referer": "https://study-assistant.iamhimanshu.me",
      "X-Title": "Study Assistant",
    };
  }

  return base;
}
