import assert from "node:assert/strict";
import { test } from "node:test";
import { isLikelyLocalModel } from "./providers.ts";

test("isLikelyLocalModel spots Ollama and LM Studio, also behind a tunnel", () => {
  const is = (name: string, baseUrl: string) =>
    isLikelyLocalModel({ name, baseUrl });
  assert.equal(is("My model", "http://localhost:11434/v1"), true);
  assert.equal(is("Box", "http://192.168.1.5:1234/v1"), true);
  assert.equal(is("Ollama", "https://my-model.trycloudflare.com/v1"), true);
  assert.equal(is("LM Studio", "https://x.ngrok.app/v1"), true);
  assert.equal(is("OpenAI", "https://api.openai.com/v1"), false);
  assert.equal(
    is("Gemini", "https://generativelanguage.googleapis.com/v1beta/openai"),
    false,
  );
});
