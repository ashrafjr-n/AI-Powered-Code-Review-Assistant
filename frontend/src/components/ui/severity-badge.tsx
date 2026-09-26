import type { Severity } from "@/lib/types";
import { SEVERITY_LABEL } from "@/lib/severity";
import { cn } from "@/lib/cn";

type Surface = "ink" | "paper";

// Severity is shown by word + dot shape + tone, never by color alone.
// Red budget: only CRITICAL is red.
const styles: Record<
  Surface,
  Record<Severity, { text: string; dot: string }>
> = {
  ink: {
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
  },
  // On the light "paper" surface (landing sample report).
  paper: {
    CRITICAL: { text: "text-red border-red/40", dot: "bg-red" },
    HIGH: { text: "text-ink-950 border-ink-950/40", dot: "bg-ink-950" },
    MEDIUM: {
      text: "text-ink-800 border-ink-950/20",
      dot: "border border-ink-800",
    },
    LOW: {
      text: "text-silver-500 border-ink-950/15",
      dot: "border border-dashed border-silver-500",
    },
  },
};

interface SeverityBadgeProps {
  severity: Severity;
  surface?: Surface;
  className?: string;
}

export function SeverityBadge({
  severity,
  surface = "ink",
  className,
}: SeverityBadgeProps) {
  const style = styles[surface][severity];
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
