import "server-only";
import { cache } from "react";
import type { AiProvider, ConnectionResult, ProviderInput } from "@/lib/types";
import { apiFetch } from "./client";

// cache(): the layout (provider pill) and the settings page share one request.
export const listProviders = cache((): Promise<AiProvider[]> =>
  apiFetch<AiProvider[]>("/providers"),
);

export async function getActiveProvider(): Promise<AiProvider | null> {
  return (await listProviders()).find((provider) => provider.isDefault) ?? null;
}

/** id = update that provider (backend checks it's yours); null = create. */
export function saveProvider(
  id: string | null,
  input: ProviderInput,
): Promise<AiProvider> {
  return apiFetch<AiProvider>(
    id ? `/providers/${encodeURIComponent(id)}` : "/providers",
    { method: id ? "PUT" : "POST", body: JSON.stringify(input) },
  );
}

export function setDefaultProvider(id: string): Promise<void> {
  return apiFetch<void>(`/providers/${encodeURIComponent(id)}/default`, {
    method: "POST",
  });
}

export function deleteProvider(id: string): Promise<void> {
  return apiFetch<void>(`/providers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** providerId lets the backend use the stored key when the key field is empty. */
export function testConnection(input: {
  baseUrl: string;
  apiKey: string;
  providerId?: string;
}): Promise<ConnectionResult> {
  return apiFetch<ConnectionResult>("/providers/test", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
