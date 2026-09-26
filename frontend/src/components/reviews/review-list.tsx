import Link from "next/link";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { formatDate } from "@/lib/format";
import { MODE_LABEL, SCOPE_LABEL } from "@/lib/labels";
import { highestSeverity } from "@/lib/severity";
import type { ReviewListItem } from "@/lib/types";

interface ReviewListProps {
  reviews: ReviewListItem[];
  /** false inside a project group, where the name is already the group's title. */
  showProject?: boolean;
}

export function ReviewList({ reviews, showProject = true }: ReviewListProps) {
  return (
    <ul className="divide-y divide-line rounded-md border border-line bg-ink-900">
      {reviews.map((review) => {
        const severity = highestSeverity(review.issues);
        return (
          <li key={review.id}>
            <Link
              href={`/projects/${review.projectId}/reviews/${review.id}`}
              className="grid gap-2 px-5 py-4 transition-colors hover:bg-ink-850 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
            >
              <span>
                {severity ? (
                  <SeverityBadge severity={severity} />
                ) : (
                  <span className="font-mono text-[11px] tracking-label text-silver-500">
                    CLEAN
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-paper">
                  {MODE_LABEL[review.mode]}
                  {showProject && ` · ${review.projectName}`}
                </span>
                <span className="mt-1 block truncate text-sm text-silver-400">
                  {review.summary}
                </span>
              </span>
              <span className="font-mono text-xs text-silver-500 sm:text-right">
                {review.issues.length} issues · {SCOPE_LABEL[review.scope]}
                <br className="hidden sm:block" />
                <span className="sm:hidden"> · </span>
                {formatDate(review.createdAt)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
