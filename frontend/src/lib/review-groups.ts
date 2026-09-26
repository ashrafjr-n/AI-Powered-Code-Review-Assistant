// ".ts" so Node's test runner can load this file directly (see review-groups.test.ts).
import { highestSeverity } from "./severity.ts";
import type { ReviewListItem, Severity } from "./types";

export interface ProjectReviewGroup {
  projectId: string;
  projectName: string;
  reviews: ReviewListItem[];
  /** Worst severity of the newest review (null = clean). */
  latestSeverity: Severity | null;
  latestAt: string;
}

/**
 * Groups history by project. Reviews arrive newest first, so the first review of a
 * group is its latest, and groups keep the order of their latest review.
 */
export function groupReviewsByProject(
  reviews: ReviewListItem[],
): ProjectReviewGroup[] {
  const groups = new Map<string, ProjectReviewGroup>();
  for (const review of reviews) {
    const group = groups.get(review.projectId);
    if (group) {
      group.reviews.push(review);
      continue;
    }
    groups.set(review.projectId, {
      projectId: review.projectId,
      projectName: review.projectName,
      reviews: [review],
      latestSeverity: highestSeverity(review.issues),
      latestAt: review.createdAt,
    });
  }
  return [...groups.values()];
}
