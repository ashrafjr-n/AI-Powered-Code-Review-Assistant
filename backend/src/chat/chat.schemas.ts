import { z } from 'zod';

export const askSchema = z.object({
  // Missing = start a new conversation.
  sessionId: z.uuid().optional(),
  question: z.string().trim().min(1).max(2000),
});

export type AskDto = z.infer<typeof askSchema>;
