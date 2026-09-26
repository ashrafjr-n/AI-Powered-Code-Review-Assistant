import { cn } from "@/lib/cn";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/severity";
import type { Severity } from "@/lib/types";

// Red only for CRITICAL; other levels are silver shades (the red budget).
const BLOCK_CLASS: Record<Severity, string> = {
  CRITICAL: "bg-red",
  HIGH: "bg-paper",
  MEDIUM: "bg-silver-400",
  LOW: "bg-line-strong",
};

interface IssueBlocksProps {
  counts: Record<Severity, number>;
  /** More issues than this are summarised as "+N". */
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

/** One small block per issue, worst first: 1 critical issue = one red block. */
export function IssueBlocks({
  counts,
  max = 40,
  size = "md",
  className,
}: IssueBlocksProps) {
  const blocks = SEVERITY_ORDER.flatMap((severity) =>
    Array.from({ length: counts[severity] }, () => severity),
  );
  const hidden = Math.max(0, blocks.length - max);
  const summary = SEVERITY_ORDER.filter((severity) => counts[severity] > 0)
    .map(
      (severity) =>
        `${counts[severity]} ${SEVERITY_LABEL[severity].toLowerCase()}`,
    )
    .join(", ");

  return (
    <span
      title={summary || "No issues"}
      className={cn("inline-flex flex-wrap items-center gap-1", className)}
    >
      <span className="sr-only">
        {summary ? `Issues: ${summary}` : "No issues"}
      </span>
      {blocks.length === 0 && (
        <span
          aria-hidden
          className={cn(
            "rounded-sm bg-line",
            size === "sm" ? "h-1.5 w-3" : "h-2 w-5",
          )}
        />
      )}
      {blocks.slice(0, max).map((severity, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "rounded-sm",
            size === "sm" ? "h-1.5 w-3" : "h-2 w-5",
            BLOCK_CLASS[severity],
          )}
        />
      ))}
      {hidden > 0 && (
        <span aria-hidden className="ml-1 font-mono text-xs text-silver-500">
          +{hidden}
        </span>
      )}
    </span>
  );
}
