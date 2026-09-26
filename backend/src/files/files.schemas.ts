import { z } from 'zod';

export const fileContentQuerySchema = z.object({
  path: z.string().min(1).max(1000),
});

export type FileContentQuery = z.infer<typeof fileContentQuerySchema>;

// Sent by the browser next to the ZIP: what it removed before upload. Only used for the
// "N skipped" note, so bad values are simply ignored (not an error).
const count = z.coerce.number().int().min(0).max(1_000_000).catch(0);
const clientSkippedSchema = z
  .object({ ignored: count, binary: count, tooLarge: count })
  .catch({ ignored: 0, binary: 0, tooLarge: 0 });

export function parseClientSkipped(raw: unknown) {
  try {
    return clientSkippedSchema.parse(
      typeof raw === 'string' ? JSON.parse(raw) : raw,
    );
  } catch {
    return { ignored: 0, binary: 0, tooLarge: 0 };
  }
}
