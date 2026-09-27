"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/cn";

interface LinkPendingProps {
  /** Size, shape and place of the hint (the caller decides where it sits). */
  className: string;
}

/**
 * Put inside a `<Link>`: shows only while that link's page is loading, so a slow click
 * (the workspace renders on the server) gets instant feedback. Always rendered and
 * fixed-size, so nothing moves. The outer span fades in after a short delay (fast
 * clicks don't flash); the inner one pulses (its own opacity animation).
 */
export function LinkPending({ className }: LinkPendingProps) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "overflow-hidden transition-opacity",
        pending ? "opacity-100 delay-150" : "opacity-0",
        className,
      )}
    >
      <span className="block size-full animate-pulse bg-silver-300" />
    </span>
  );
}
