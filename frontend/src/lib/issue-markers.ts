// ".ts" so Node's test runner can load this file directly (see issue-markers.test.ts).
import { SEVERITY_ORDER } from "./severity.ts";
import type { Review, Severity } from "./types";

export interface LineMarker {
  severity: Severity;
  /** Issue titles on this line, for the hover text. */
  titles: string[];
}

/**
 * Gutter dots for one file: the issues of the NEWEST review that looked at this file
 * (older reviews may point at lines that changed since). `reviews` = newest first.
 */
export function issueMarkers(
  reviews: Review[],
  path: string,
): Map<number, LineMarker> {
  const markers = new Map<number, LineMarker>();
  const latest = reviews.find((review) => review.filePaths.includes(path));
  for (const issue of latest?.issues ?? []) {
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
