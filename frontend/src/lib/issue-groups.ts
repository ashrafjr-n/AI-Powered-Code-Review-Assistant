// ".ts" so Node's test runner can load this file directly (see issue-groups.test.ts).
import { SEVERITY_ORDER } from "./severity.ts";
import type { ReviewIssue, Severity } from "./types";

export interface FileIssueGroup {
  /** null = issues that don't point at a file ("General"). */
  filePath: string | null;
  issues: ReviewIssue[];
}

const rank = (severity: Severity) => SEVERITY_ORDER.indexOf(severity);

/**
 * Report view: issues grouped by file, the file with the worst issue first (ties by
 * path), issues inside a file worst first then by line. General issues come last.
 */
export function groupIssuesByFile(
  issues: ReviewIssue[],
  only?: Severity,
): FileIssueGroup[] {
  const groups = new Map<string | null, ReviewIssue[]>();
  for (const issue of issues) {
    if (only && issue.severity !== only) continue;
    const key = issue.filePath ?? null;
    groups.set(key, [...(groups.get(key) ?? []), issue]);
  }
  const worst = (list: ReviewIssue[]) =>
    Math.min(...list.map((issue) => rank(issue.severity)));
  return [...groups.entries()]
    .map(([filePath, list]) => ({
      filePath,
      issues: [...list].sort(
        (a, b) =>
          rank(a.severity) - rank(b.severity) || (a.line ?? 0) - (b.line ?? 0),
      ),
    }))
    .sort((a, b) => {
      if (a.filePath === null) return 1;
      if (b.filePath === null) return -1;
      return (
        worst(a.issues) - worst(b.issues) ||
        a.filePath.localeCompare(b.filePath)
      );
    });
}
