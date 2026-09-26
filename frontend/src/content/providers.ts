// Settings texts about where models run. The server says whether it can reach local
// models (GET /providers/options), so every user reads what is true for them.

export const localModelsNote = {
  // Public server: it can't call the user's localhost.
  hosted:
    "Model on your own computer (LM Studio, Ollama)? This server can't reach your localhost. Give it a public https address with a secure tunnel, for example Cloudflare Tunnel or ngrok, and use that address as the base URL. Or run Redline yourself (see the README).",
  // Self-hosted or development server: localhost works.
  selfHosted:
    "Local models (LM Studio, Ollama) work directly: this Redline server runs where it can reach them.",
};

export const emptyProvidersBody =
  "Add a cloud model with an API key (Gemini and Groq have free tiers), or a model running on your own computer.";

/** Shown in the form when a local preset is picked on a public server. */
export const tunnelHint =
  "This runs on your computer. Paste the https address of your tunnel, ending in /v1 (for example https://my-model.trycloudflare.com/v1).";
