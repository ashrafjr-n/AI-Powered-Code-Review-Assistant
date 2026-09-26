import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

// A small mono tag followed by a hairline to the edge: "HOW IT WORKS ─────".
export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="rounded-sm border border-line px-2 py-1 font-mono text-[11px] tracking-label text-silver-400 uppercase">
        {children}
      </span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}
