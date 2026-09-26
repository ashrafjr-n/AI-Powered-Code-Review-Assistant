import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewReport } from "@/components/review/review-report";
import { MODE_LABEL } from "@/lib/labels";
import { SEVERITY_ORDER } from "@/lib/severity";
import { firstParam } from "@/lib/workspace-url";
import { getProject } from "@/lib/api/projects";
import { getReview } from "@/lib/api/reviews";

type Props = PageProps<"/projects/[id]/reviews/[reviewId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const review = await getReview((await params).reviewId);
  return {
    title: review ? `${MODE_LABEL[review.mode]} review` : "Review not found",
  };
}

export default async function ReviewPage({ params, searchParams }: Props) {
  const { id, reviewId } = await params;
  // Only a known severity from the URL is used; anything else shows all issues.
  const requested = firstParam((await searchParams).severity);
  const only = SEVERITY_ORDER.find((severity) => severity === requested);
  const [project, review] = await Promise.all([
    getProject(id),
    getReview(reviewId),
  ]);
  // The review must belong to this project; otherwise it's a 404, not someone else's data.
  if (!project || !review || review.projectId !== id) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <ReviewReport review={review} only={only} />
    </div>
  );
}
