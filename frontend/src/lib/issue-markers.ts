// ".ts" so Node's test runner can load this file directly (see issue-markers.test.ts).
import { SEVERITY_ORDER } from "./severity.ts";
import type { Review, Severity } from "./types";

export interface LineMarker {
  severity: Severity;
  /** Issue titles on this line, for the hover text. */
  titles: string[];
}

/**
 * Dots for one file from a list of issues: the worst severity per line wins.
 * Which review to use (the newest full review of this file in the current code) is
 * asked from the backend: GET /reviews?file=…&codeVersion=…&pageSize=1.
 */
export function markersFor(
  issues: Review["issues"],
  path: string,
): Map<number, LineMarker> {
  const markers = new Map<number, LineMarker>();
  for (const issue of issues) {
    if (issue.filePath !== path || !issue.line) continue;
    const current = markers.get(issue.line);
    const worse =
      !current ||
      SEVERITY_ORDER.indexOf(issue.severity) <
        SEVERITY_ORDER.indexOf(current.severity);
    markers.set(issue.line, {
      severity: worse ? issue.severity : current.severity,
      titles: [...(current?.titles ?? []), issue.title],
    });
  }
  return markers;
}
