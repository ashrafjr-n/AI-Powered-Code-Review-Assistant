// MOCK (frontend-only phase). Replaced by the AI providers API in C4.
import type { AiProvider } from "@/lib/types";
import { db, wait } from "./db";

export interface ProviderInput {
  name: string;
  baseUrl: string;
  model: string;
  /** Empty = keep the stored key (on edit) or no key (local servers). */
  apiKey: string;
}

export async function listProviders(): Promise<AiProvider[]> {
  return [...db.providers];
}

export async function getActiveProvider(): Promise<AiProvider | null> {
  return db.providers.find((provider) => provider.isDefault) ?? null;
}

export async function saveProvider(
  id: string | null,
  input: ProviderInput,
): Promise<void> {
  if (id) {
    db.providers = db.providers.map((provider) =>
      provider.id === id
        ? {
            ...provider,
            name: input.name,
            baseUrl: input.baseUrl,
            model: input.model,
            hasApiKey: provider.hasApiKey || input.apiKey.length > 0,
          }
        : provider,
    );
    return;
  }
  db.providers.push({
    id: crypto.randomUUID(),
    name: input.name,
    baseUrl: input.baseUrl,
    model: input.model,
    hasApiKey: input.apiKey.length > 0,
    isDefault: db.providers.length === 0,
  });
}

export async function setDefaultProvider(id: string): Promise<void> {
  db.providers = db.providers.map((provider) => ({
    ...provider,
    isDefault: provider.id === id,
  }));
}

export async function deleteProvider(id: string): Promise<void> {
  const wasDefault = db.providers.find(
    (provider) => provider.id === id,
  )?.isDefault;
  db.providers = db.providers.filter((provider) => provider.id !== id);
  if (wasDefault && db.providers[0]) db.providers[0].isDefault = true;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
  models: string[];
}

// The real test (C4) calls GET {baseUrl}/models from the backend.
export async function testConnection(
  baseUrl: string,
): Promise<ConnectionResult> {
  await wait(700);
  if (baseUrl.includes("openai.com")) {
    return {
      ok: true,
      message: "Connected. 3 models found.",
      models: ["gpt-5", "gpt-5-mini", "gpt-4.1"],
    };
  }
  if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
    return {
      ok: true,
      message: "Connected. 2 models found.",
      models: ["qwen2.5-coder-14b", "llama-3.1-8b-instruct"],
    };
  }
  return {
    ok: true,
    message: "Connected. 1 model found.",
    models: ["default"],
  };
}
