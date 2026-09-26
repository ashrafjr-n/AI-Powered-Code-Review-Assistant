import type { ReviewIssue, Severity } from "./types";

export const SEVERITY_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export function countBySeverity(
  issues: ReviewIssue[],
): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const issue of issues) counts[issue.severity]++;
  return counts;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// The one-line verdict at the top of every report.
export function reviewVerdict(issues: ReviewIssue[]): string {
  const counts = countBySeverity(issues);
  if (counts.CRITICAL > 0) {
    return `${plural(counts.CRITICAL, "critical issue")} should block shipping.`;
  }
  if (counts.HIGH > 0) {
    return `No blockers. ${plural(counts.HIGH, "high-severity issue")} to fix soon.`;
  }
  if (issues.length > 0) {
    return `No blocking issues. ${plural(issues.length, "suggestion")}.`;
  }
  return "Clean. Nothing worth flagging in this lens.";
}
