// MOCK (frontend-only phase). Replaced by the review engine + history API in C5.
import { highestSeverity } from "@/lib/severity";
import type {
  Review,
  ReviewListItem,
  ReviewMode,
  ReviewScope,
  Severity,
} from "@/lib/types";
import { db, wait } from "./db";
import { getActiveProvider } from "./providers";

export interface ReviewFilters {
  q?: string;
  mode?: ReviewMode;
  severity?: Severity;
  projectId?: string;
}

const newestFirst = (a: Review, b: Review) =>
  b.createdAt.localeCompare(a.createdAt);

export async function listProjectReviews(projectId: string): Promise<Review[]> {
  return db.reviews
    .filter((review) => review.projectId === projectId)
    .sort(newestFirst);
}

export async function getReview(id: string): Promise<Review | null> {
  return db.reviews.find((review) => review.id === id) ?? null;
}

// Search matches the summary, issue titles, file paths and the project name.
// `projects` = the user's real projects (from the API); reviews of other projects are hidden.
export async function listReviews(
  filters: ReviewFilters,
  projects: { id: string; name: string }[],
): Promise<ReviewListItem[]> {
  const q = filters.q?.trim().toLowerCase();
  const names = new Map(projects.map((project) => [project.id, project.name]));
  return db.reviews
    .filter((review) => names.has(review.projectId))
    .map((review) => ({
      ...review,
      projectName: names.get(review.projectId) ?? "",
    }))
    .filter((review) => !filters.mode || review.mode === filters.mode)
    .filter(
      (review) => !filters.projectId || review.projectId === filters.projectId,
    )
    .filter(
      (review) =>
        !filters.severity ||
        highestSeverity(review.issues) === filters.severity,
    )
    .filter(
      (review) =>
        !q ||
        [
          review.summary,
          review.projectName,
          ...review.filePaths,
          ...review.issues.map((issue) => issue.title),
        ].some((text) => text.toLowerCase().includes(q)),
    )
    .sort(newestFirst);
}

// The mock "model" re-uses issues from the seeded reviews that match the lens and files.
// The real engine (C5) sends the files to the configured provider and validates the JSON.
export async function runReview(input: {
  projectId: string;
  mode: ReviewMode;
  scope: ReviewScope;
  filePaths: string[];
}): Promise<Review> {
  await wait(1500);
  const known = db.reviewTemplates.filter(
    (review) => review.mode === input.mode,
  );
  const issues = known
    .flatMap((review) => review.issues)
    .filter(
      (issue) => !issue.filePath || input.filePaths.includes(issue.filePath),
    );
  const recommendations = issues.length
    ? [...new Set(known.flatMap((review) => review.recommendations))].slice(
        0,
        3,
      )
    : [];
  const provider = await getActiveProvider();

  const review: Review = {
    id: crypto.randomUUID(),
    ...input,
    summary: issues.length
      ? `Reviewed ${input.filePaths.length} file${input.filePaths.length === 1 ? "" : "s"}. The main risks are listed below, worst first.`
      : `Reviewed ${input.filePaths.length} file${input.filePaths.length === 1 ? "" : "s"}. Nothing worth flagging for this lens.`,
    issues,
    recommendations,
    providerName: provider?.name ?? "No provider",
    model: provider?.model ?? "none",
    createdAt: new Date().toISOString(),
  };
  db.reviews.push(review);
  return review;
}
