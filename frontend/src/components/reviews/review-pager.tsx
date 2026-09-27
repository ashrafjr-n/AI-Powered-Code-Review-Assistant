import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

interface ReviewPagerProps {
  page: number;
  pages: number;
  /** The current filters, kept on every page link. */
  filters: Record<string, string | undefined>;
}

export function reviewsHref(
  filters: Record<string, string | undefined>,
  page = 1,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value) params.set(key, value);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/reviews${query ? `?${query}` : ""}`;
}

// Plain links (?page=2): pages can be shared, and back/forward works.
export function ReviewPager({ page, pages, filters }: ReviewPagerProps) {
  if (pages <= 1) return null;
  return (
    <nav
      aria-label="Review pages"
      className="flex items-center justify-between gap-3 font-mono text-xs text-silver-500"
    >
      {page > 1 ? (
        <Link
          href={reviewsHref(filters, page - 1)}
          rel="prev"
          className={buttonClass("secondary", "sm")}
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.5} />
          Newer
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link
          href={reviewsHref(filters, page + 1)}
          rel="next"
          className={buttonClass("secondary", "sm")}
        >
          Older
          <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
