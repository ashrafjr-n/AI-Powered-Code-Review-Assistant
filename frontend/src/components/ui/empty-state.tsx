import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  /** Use "h1" when the empty state is the whole page. */
  titleAs?: "h1" | "h2";
}

// Empty states teach the next step instead of showing a blank page.
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  titleAs: Title = "h2",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-line-strong px-6 py-16 text-center">
      <Icon aria-hidden className="size-6 text-silver-500" strokeWidth={1.5} />
      <Title className="mt-4 font-medium text-paper">{title}</Title>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-silver-400">
        {body}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
