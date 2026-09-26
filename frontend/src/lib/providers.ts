// A provider is "Local" when its server runs on this machine.
export function providerLocation(baseUrl: string): "Local" | "Cloud" {
  try {
    const host = new URL(baseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0"
      ? "Local"
      : "Cloud";
  } catch {
    // An invalid URL can't be a reachable local server; the form validates URLs anyway.
    return "Cloud";
  }
}

export interface ProviderPreset {
  name: string;
  baseUrl: string;
  model: string;
  needsKey: boolean;
  /** Runs on the user's computer (localhost): a public server needs a tunnel URL. */
  local: boolean;
}

// Gemini and Groq have free tiers (good for trying Redline with your own key).
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.5-flash-lite",
    needsKey: true,
    local: false,
  },
  {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b",
    needsKey: true,
    local: false,
  },
  {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5-mini",
    needsKey: true,
    local: false,
  },
  {
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    model: "",
    needsKey: false,
    local: true,
  },
  {
    name: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    model: "qwen2.5-coder",
    needsKey: false,
    local: true,
  },
  {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "",
    needsKey: true,
    local: false,
  },
];
