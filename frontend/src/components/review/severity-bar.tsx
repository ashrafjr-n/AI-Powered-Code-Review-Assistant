import { cn } from "@/lib/cn";
import {
  countBySeverity,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
} from "@/lib/severity";
import type { ReviewIssue, Severity } from "@/lib/types";

type Surface = "ink" | "paper";

// Red only for CRITICAL; other levels are ink/silver shades. Counts are always written out.
const segmentClass: Record<Surface, Record<Severity, string>> = {
  ink: {
    CRITICAL: "bg-red",
    HIGH: "bg-paper",
    MEDIUM: "bg-silver-400",
    LOW: "bg-line-strong",
  },
  paper: {
    CRITICAL: "bg-red",
    HIGH: "bg-ink-950",
    MEDIUM: "bg-ink-800/50",
    LOW: "bg-silver-300",
  },
};

interface SeverityBarProps {
  issues: ReviewIssue[];
  surface?: Surface;
  /**
   * "share" = one bar split by proportion (the landing sample).
   * "count" = one block per issue, so 1 critical issue is one red block,
   * not a full red bar that looks like 50 of them.
   */
  variant?: "share" | "count";
}

// Enough blocks to show a real review; more are summarised as "+N".
const MAX_BLOCKS = 40;

export function SeverityBar({
  issues,
  surface = "ink",
  variant = "share",
}: SeverityBarProps) {
  const counts = countBySeverity(issues);
  // Issues come sorted worst first, so the blocks read left (worst) to right.
  const blocks = SEVERITY_ORDER.flatMap((severity) =>
    Array.from({ length: counts[severity] }, () => severity),
  );
  const hidden = Math.max(0, blocks.length - MAX_BLOCKS);
  const segments = SEVERITY_ORDER.filter(
    (severity) => counts[severity] > 0,
  ).map((severity) => ({
    severity,
    percent: (counts[severity] / issues.length) * 100,
  }));

  return (
    <div>
      {variant === "count" ? (
        <div className="flex flex-wrap items-center gap-1" aria-hidden>
          {blocks.length === 0 && (
            <span className="h-2 w-5 rounded-sm bg-line" />
          )}
          {blocks.slice(0, MAX_BLOCKS).map((severity, index) => (
            <span
              key={index}
              className={cn(
                "h-2 w-5 rounded-sm",
                segmentClass[surface][severity],
              )}
            />
          ))}
          {hidden > 0 && (
            <span className="ml-1 font-mono text-xs text-silver-500">
              +{hidden}
            </span>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex h-2 gap-0.5 overflow-hidden rounded-sm",
            segments.length === 0 &&
              (surface === "ink" ? "bg-line" : "bg-ink-950/10"),
          )}
        >
          {segments.map((segment) => (
            <span
              key={segment.severity}
              className={segmentClass[surface][segment.severity]}
              style={{ width: `${segment.percent}%` }}
            />
          ))}
        </div>
      )}
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-silver-500">
        {SEVERITY_ORDER.map((severity) => (
          <li key={severity}>
            <span
              className={cn(
                "tabular-nums",
                surface === "ink" ? "text-paper" : "text-ink-950",
              )}
            >
              {counts[severity]}
            </span>{" "}
            {SEVERITY_LABEL[severity]}
          </li>
        ))}
      </ul>
    </div>
  );
}
