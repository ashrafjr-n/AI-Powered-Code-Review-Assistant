import "server-only";
import { cache } from "react";
import type {
  ReviewListItem,
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
}

/** History search. The backend only returns the signed-in user's reviews. */
export function listReviews(
  query: ReviewQuery = {},
): Promise<ReviewListItem[]> {
  const params = new URLSearchParams(
    Object.entries(query).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  return apiFetch<ReviewListItem[]>(`/reviews?${params}`);
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
