import { z } from 'zod';

export const askSchema = z.object({
  // Missing = start a new conversation.
  sessionId: z.uuid().optional(),
  question: z.string().trim().min(1).max(2000),
  // The file open in the workspace: always sent as context. Checked on the server.
  currentFile: z.string().max(1000).optional(),
});

export type AskDto = z.infer<typeof askSchema>;
