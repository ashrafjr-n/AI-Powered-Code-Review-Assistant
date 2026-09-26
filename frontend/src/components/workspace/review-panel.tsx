import Link from "next/link";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { formatDate } from "@/lib/format";
import { MODE_LABEL, SCOPE_LABEL } from "@/lib/labels";
import { highestSeverity } from "@/lib/severity";
import type { Review, ReviewPlan } from "@/lib/types";
import { ReviewForm } from "./review-form";

interface ReviewPanelProps {
  projectId: string;
  currentFile?: string;
  /** Readable file paths (diff review pickers). */
  paths: string[];
  reviews: Review[];
  plan: ReviewPlan | null;
}

export function ReviewPanel({
  projectId,
  currentFile,
  paths,
  reviews,
  plan,
}: ReviewPanelProps) {
  return (
    <div className="space-y-8 p-4">
      <ReviewForm
        projectId={projectId}
        currentFile={currentFile}
        paths={paths}
        plan={plan}
      />
      <section aria-labelledby="recent-reviews" className="space-y-3">
        <h2
          id="recent-reviews"
          className="font-mono text-[11px] tracking-label text-silver-500 uppercase"
        >
          Recent reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-silver-500">
            No reviews yet for this project.
          </p>
        ) : (
          <ul className="space-y-2">
            {reviews.slice(0, 5).map((review) => {
              const severity = highestSeverity(review.issues);
              return (
                <li key={review.id}>
                  <Link
                    href={`/projects/${projectId}/reviews/${review.id}`}
                    className="block rounded-sm border border-line px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-ink-850"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm text-paper">
                        {MODE_LABEL[review.mode]}
                      </span>
                      {severity ? (
                        <SeverityBadge severity={severity} />
                      ) : (
                        <span className="font-mono text-[11px] text-silver-500">
                          CLEAN
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block font-mono text-xs text-silver-500">
                      {SCOPE_LABEL[review.scope]} ·{" "}
                      {formatDate(review.createdAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {reviews.length > 5 && (
          <Link
            href={`/reviews?project=${projectId}`}
            className="inline-block font-mono text-xs text-silver-400 underline decoration-line-strong underline-offset-4 hover:text-paper"
          >
            See all {reviews.length} reviews →
          </Link>
        )}
      </section>
    </div>
  );
}
