import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewReport } from "@/components/review/review-report";
import { MODE_LABEL } from "@/lib/labels";
import { getProject } from "@/lib/api/projects";
import { getReview } from "@/lib/api/reviews";

type Props = PageProps<"/projects/[id]/reviews/[reviewId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const review = await getReview((await params).reviewId);
  return {
    title: review ? `${MODE_LABEL[review.mode]} review` : "Review not found",
  };
}

export default async function ReviewPage({ params }: Props) {
  const { id, reviewId } = await params;
  const [project, review] = await Promise.all([
    getProject(id),
    getReview(reviewId),
  ]);
  // The review must belong to this project; otherwise it's a 404, not someone else's data.
  if (!project || !review || review.projectId !== id) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <ReviewReport review={review} />
    </div>
  );
}
