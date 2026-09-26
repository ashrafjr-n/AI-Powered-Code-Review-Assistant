"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import {
  deleteProvider,
  saveProvider,
  setDefaultProvider,
  testConnection,
} from "@/lib/api/providers";
import type { ConnectionResult } from "@/lib/types";

export interface ProviderFormState {
  ok: boolean;
  error?: string;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    baseUrl: String(formData.get("baseUrl") ?? "")
      .trim()
      .replace(/\/+$/, ""),
    model: String(formData.get("model") ?? "").trim(),
    apiKey: String(formData.get("apiKey") ?? "").trim(),
  };
}

export async function saveProviderAction(
  id: string | null,
  _previous: ProviderFormState,
  formData: FormData,
): Promise<ProviderFormState> {
  const input = readForm(formData);
  if (!input.name || input.name.length > 60)
    return { ok: false, error: "Name must be 1 to 60 characters." };
  if (!isHttpUrl(input.baseUrl))
    return {
      ok: false,
      error: "Base URL must start with http:// or https://.",
    };
  if (!input.model || input.model.length > 100)
    return { ok: false, error: "Enter a model name." };
  if (input.apiKey.length > 500)
    return { ok: false, error: "That API key is too long." };

  // The backend validates again, checks the URL (SSRF guard) and that `id` is yours.
  try {
    await saveProvider(id, input);
  } catch (error) {
    if (error instanceof ApiError && error.status < 500)
      return { ok: false, error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function testConnectionAction(
  formData: FormData,
): Promise<ConnectionResult> {
  const { baseUrl, apiKey } = readForm(formData);
  if (!isHttpUrl(baseUrl)) {
    return { ok: false, message: "Enter a valid base URL first.", models: [] };
  }
  const providerId = String(formData.get("providerId") ?? "") || undefined;
  try {
    return await testConnection({ baseUrl, apiKey, providerId });
  } catch (error) {
    // e.g. 429 (10 tests per minute) or 404 (not your provider).
    if (error instanceof ApiError && error.status < 500)
      return { ok: false, message: error.message, models: [] };
    throw error;
  }
}

export async function setDefaultProviderAction(id: string): Promise<void> {
  await setDefaultProvider(id);
  revalidatePath("/", "layout");
}

export async function deleteProviderAction(id: string): Promise<void> {
  await deleteProvider(id);
  revalidatePath("/", "layout");
}
