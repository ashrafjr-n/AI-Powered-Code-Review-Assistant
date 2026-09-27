import "server-only";
import { cache } from "react";
import type {
  ReviewListItem,
  ReviewPage,
  ReviewPlan,
  ReviewMode,
  ReviewScope,
  Severity,
} from "@/lib/types";
import { ApiError, apiFetch } from "./client";

export interface ReviewQuery {
  q?: string;
  mode?: ReviewMode;
  severity?: Severity;
  projectId?: string;
  /** Only reviews that read this whole file (no diff reviews): the issue dots. */
  file?: string;
  codeVersion?: number;
  page?: number;
  /** Default 20, max 50. */
  pageSize?: number;
}

/** History search, one page. The backend only returns the signed-in user's reviews. */
export function listReviews(query: ReviewQuery = {}): Promise<ReviewPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    // 0 is a real value (code version 0), only empty ones are left out.
    if (value !== undefined && value !== "") params.set(key, String(value));
  return apiFetch<ReviewPage>(`/reviews?${params}`);
}

/** cache(): the report page and its metadata share one request. null = not found / not yours. */
export const getReview = cache(
  async (id: string): Promise<ReviewListItem | null> => {
    try {
      return await apiFetch<ReviewListItem>(
        `/reviews/${encodeURIComponent(id)}`,
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      )
        return null;
      throw error;
    }
  },
);

/** Waits for the model (can take minutes with a local CPU model). */
export function runReview(
  projectId: string,
  input: { mode: ReviewMode; scope: ReviewScope; filePaths: string[] },
): Promise<ReviewListItem> {
  return apiFetch<ReviewListItem>(
    `/projects/${encodeURIComponent(projectId)}/reviews`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

/** How many files a whole-project review would send (shown before running it). */
export function getReviewPlan(projectId: string): Promise<ReviewPlan> {
  return apiFetch<ReviewPlan>(
    `/projects/${encodeURIComponent(projectId)}/reviews/plan`,
  );
}
