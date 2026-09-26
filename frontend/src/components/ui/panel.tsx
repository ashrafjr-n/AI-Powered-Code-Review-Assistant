import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// The basic surface: raised ink with a hairline border.
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-line bg-ink-900", className)}
      {...props}
    />
  );
}
