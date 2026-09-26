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
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5-mini",
    needsKey: true,
  },
  {
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    model: "",
    needsKey: false,
  },
  {
    name: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    model: "qwen2.5-coder",
    needsKey: false,
  },
  {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "",
    needsKey: true,
  },
];
