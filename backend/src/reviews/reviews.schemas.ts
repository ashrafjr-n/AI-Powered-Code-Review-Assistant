import { z } from 'zod';

const mode = z.enum(['SECURITY', 'PERFORMANCE', 'QUALITY']);

export const runReviewSchema = z.object({
  mode,
  scope: z.enum(['FILE', 'FILES', 'PROJECT', 'DIFF']),
  // Ignored for PROJECT; [before, after] for DIFF. Checked against the project's files.
  filePaths: z.array(z.string().min(1).max(1000)).max(2000).default([]),
});

export const listReviewsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  mode: mode.optional(),
  // The review's worst issue (Review.highestSeverity), like the badge in lists.
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  projectId: z.uuid().optional(),
  // Only reviews that read this whole file (diff reviews excluded): the workspace's
  // issue dots. With codeVersion: only reviews of that upload.
  file: z.string().min(1).max(1000).optional(),
  codeVersion: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type RunReviewDto = z.infer<typeof runReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
