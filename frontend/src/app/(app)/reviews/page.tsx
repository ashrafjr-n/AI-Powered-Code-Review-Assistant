import type { Metadata } from "next";
import Link from "next/link";
import { History, SearchX } from "lucide-react";
import { ReviewFilters } from "@/components/reviews/review-filters";
import { ReviewList } from "@/components/reviews/review-list";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { MODE_LABEL } from "@/lib/labels";
import { SEVERITY_ORDER } from "@/lib/severity";
import type { ReviewMode } from "@/lib/types";
import { firstParam } from "@/lib/workspace-url";
import { listProjects } from "@/lib/api/projects";
import { listReviews } from "@/lib/api/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({
  searchParams,
}: PageProps<"/reviews">) {
  const query = await searchParams;
  // Only accept known values from the URL; anything else is ignored.
  const q = firstParam(query.q)?.slice(0, 200);
  const mode = (Object.keys(MODE_LABEL) as ReviewMode[]).find(
    (m) => m === firstParam(query.mode),
  );
  const severity = SEVERITY_ORDER.find((s) => s === firstParam(query.severity));
  const projects = await listProjects();
  const projectId = projects.find(
    (project) => project.id === firstParam(query.project),
  )?.id;
  const filtered = Boolean(q || mode || severity || projectId);
  const reviews = await listReviews({ q, mode, severity, projectId });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Every review you ran, in one place."
      />
      <ReviewFilters
        q={q}
        mode={mode}
        severity={severity}
        project={projectId}
        projects={projects.map(({ id, name }) => ({ id, name }))}
      />
      <p aria-live="polite" className="font-mono text-xs text-silver-500">
        {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        {filtered && (
          <>
            {" · "}
            <Link
              href="/reviews"
              className="text-silver-300 underline underline-offset-2 hover:text-paper"
            >
              Clear filters
            </Link>
          </>
        )}
      </p>
      {reviews.length > 0 ? (
        <ReviewList reviews={reviews} />
      ) : filtered ? (
        <EmptyState
          icon={SearchX}
          title="No reviews match"
          body="Try another word, or clear the filters to see every review."
          action={
            <Link href="/reviews" className={buttonClass("secondary")}>
              Clear filters
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={History}
          title="No reviews yet"
          body="Open a project, pick a lens and run your first review. It will show up here."
          action={
            <Link href="/projects" className={buttonClass("primary")}>
              Go to projects
            </Link>
          }
        />
      )}
    </div>
  );
}
