import type { Severity } from "@/lib/types";
import { SEVERITY_LABEL } from "@/lib/severity";
import { cn } from "@/lib/cn";

// Severity is shown by word + dot shape + tone, never by color alone.
// Red budget: only CRITICAL is red.
const styles: Record<Severity, { text: string; dot: string }> = {
  CRITICAL: { text: "text-red border-red/40", dot: "bg-red" },
  HIGH: { text: "text-paper border-line-strong", dot: "bg-silver-200" },
  MEDIUM: {
    text: "text-silver-300 border-line",
    dot: "border border-silver-300",
  },
  LOW: {
    text: "text-silver-500 border-line",
    dot: "border border-dashed border-silver-500",
  },
};

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const style = styles[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[11px] tracking-label uppercase",
        style.text,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", style.dot)} />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
