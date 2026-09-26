import { z } from 'zod';

const mode = z.enum(['SECURITY', 'PERFORMANCE', 'QUALITY']);

export const runReviewSchema = z.object({
  mode,
  scope: z.enum(['FILE', 'FILES', 'PROJECT']),
  // Ignored for PROJECT. Checked against the project's files on the server.
  filePaths: z.array(z.string().min(1).max(1000)).max(2000).default([]),
});

export const listReviewsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  mode: mode.optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  projectId: z.uuid().optional(),
});

export type RunReviewDto = z.infer<typeof runReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
