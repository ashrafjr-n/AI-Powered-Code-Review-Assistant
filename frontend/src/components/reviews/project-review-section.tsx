import Link from "next/link";
import { ArrowRight, Filter } from "lucide-react";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { formatDate } from "@/lib/format";
import type { ProjectReviewGroup } from "@/lib/review-groups";
import { ReviewList } from "./review-list";

interface ProjectReviewSectionProps {
  group: ProjectReviewGroup;
  /** Hide "only this project" when the list is already filtered to it. */
  filteredToProject: boolean;
}

// One project's reviews: title, how it stands now (latest result), and its reviews.
export function ProjectReviewSection({
  group,
  filteredToProject,
}: ProjectReviewSectionProps) {
  const headingId = `reviews-${group.projectId}`;
  const count = group.reviews.length;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 space-y-1">
          <h2
            id={headingId}
            className="truncate text-base font-medium text-paper"
          >
            {group.projectName}
          </h2>
          <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-silver-500">
            <span>
              {count} {count === 1 ? "review" : "reviews"}
            </span>
            <span aria-hidden>·</span>
            <span>Latest {formatDate(group.latestAt)}</span>
            <span aria-hidden>·</span>
            {group.latestSeverity ? (
              <SeverityBadge severity={group.latestSeverity} />
            ) : (
              <span className="tracking-label uppercase">Clean</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
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
      </header>
      <ReviewList reviews={group.reviews} showProject={false} />
    </section>
  );
}
