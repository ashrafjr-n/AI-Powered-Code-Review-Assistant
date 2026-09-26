import { z } from 'zod';

const baseUrl = z
  .url({
    protocol: /^https?$/,
    error: 'Base URL must start with http:// or https://.',
  })
  .max(300)
  .transform((url) => url.replace(/\/+$/, ''));
// Empty = no key (local servers) on create, or "keep the stored key" on update.
const apiKey = z.string().trim().max(500).default('');

export const providerInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  baseUrl,
  model: z.string().trim().min(1).max(100),
  apiKey,
});

export const testConnectionSchema = z.object({
  baseUrl,
  apiKey,
  // When editing without typing the key again, test with the stored one.
  providerId: z.uuid().optional(),
});

export type ProviderInput = z.infer<typeof providerInputSchema>;
export type TestConnectionInput = z.infer<typeof testConnectionSchema>;
