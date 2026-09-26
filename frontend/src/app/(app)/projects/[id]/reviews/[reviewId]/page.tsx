import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ReviewReport } from "@/components/review/review-report";
import { MODE_LABEL } from "@/lib/labels";
import { getProject } from "@/lib/api/projects";
import { getReview } from "@/mocks/reviews";

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
      <Link
        href={`/projects/${id}`}
        className="mb-6 inline-flex items-center gap-1 font-mono text-xs text-silver-500 hover:text-paper"
      >
        <ChevronLeft aria-hidden className="size-3.5" strokeWidth={1.5} />
        {project.name}
      </Link>
      <ReviewReport review={review} />
    </div>
  );
}
