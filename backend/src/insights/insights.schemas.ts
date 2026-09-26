import { z } from 'zod';

export const generateInsightSchema = z.object({
  kind: z.enum(['ARCHITECTURE', 'README', 'SETUP', 'API_DOCS']),
});

export type GenerateInsightDto = z.infer<typeof generateInsightSchema>;
