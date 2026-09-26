import { cn } from "@/lib/cn";

// Placeholder blocks shaped like the real content, shown while a page loads.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-sm bg-ink-850", className)}
    />
  );
}
