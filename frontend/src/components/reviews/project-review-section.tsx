import Link from "next/link";
import { ArrowRight, ChevronRight, Filter } from "lucide-react";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { formatDate } from "@/lib/format";
import type { ProjectReviewGroup } from "@/lib/review-groups";
import { ReviewList } from "./review-list";

interface ProjectReviewSectionProps {
  group: ProjectReviewGroup;
  /** Hide "only this project" when the list is already filtered to it. */
  filteredToProject: boolean;
  /** Closed by default; open when the user searched or filtered (they want to see matches). */
  defaultOpen: boolean;
}

// One project's reviews, collapsed to a summary row: name, count, latest result.
// Native <details>: keyboard and screen-reader support for free, no JavaScript.
export function ProjectReviewSection({
  group,
  filteredToProject,
  defaultOpen,
}: ProjectReviewSectionProps) {
  const count = group.reviews.length;
  return (
    <details
      open={defaultOpen}
      className="group details-smooth rounded-md border border-line bg-ink-900 transition-colors duration-200 open:border-line-strong open:bg-ink-950"
    >
      <summary className="flex list-none flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-ink-850 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-silver-500 transition-transform duration-200 group-open:rotate-90"
          strokeWidth={1.5}
        />
        <h2 className="min-w-0 flex-1 truncate text-base font-medium text-paper">
          {group.projectName}
        </h2>
        <span className="flex flex-wrap items-center gap-2 font-mono text-xs text-silver-500">
          <span>
            {count} {count === 1 ? "review" : "reviews"}
          </span>
          <span aria-hidden>·</span>
          <span>Latest {formatDate(group.latestAt)}</span>
          {group.latestSeverity ? (
            <SeverityBadge severity={group.latestSeverity} />
          ) : (
            <span className="tracking-label uppercase">Clean</span>
          )}
        </span>
      </summary>
      <div className="space-y-3 border-t border-line p-3 sm:p-4">
        <div className="flex justify-end gap-4 font-mono text-xs">
          {!filteredToProject && (
            <Link
              href={`/reviews?project=${group.projectId}`}
              className="inline-flex items-center gap-1.5 text-silver-400 transition-colors hover:text-paper"
            >
              <Filter aria-hidden className="size-3.5" strokeWidth={1.5} />
              Only this project
            </Link>
          )}
          <Link
            href={`/projects/${group.projectId}`}
            className="inline-flex items-center gap-1.5 text-silver-400 transition-colors hover:text-paper"
          >
            Open project
            <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.5} />
          </Link>
        </div>
        <ReviewList reviews={group.reviews} showProject={false} />
      </div>
    </details>
  );
}
