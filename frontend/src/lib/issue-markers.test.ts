import assert from "node:assert/strict";
import { test } from "node:test";
import { issueMarkers } from "./issue-markers.ts";
import type { Review } from "./types";

const review = (
  id: string,
  filePaths: string[],
  issues: Review["issues"],
  extra: Partial<Review> = {},
): Review => ({
  id,
  projectId: "p",
  mode: "SECURITY",
  scope: "FILES",
  diff: null,
  filePaths,
  summary: "",
  issues,
  recommendations: [],
  providerName: "p",
  model: "m",
  createdAt: "2026-09-26T00:00:00Z",
  codeVersion: 1,
  ...extra,
});

test("issueMarkers uses the newest review of the file and keeps the worst severity per line", () => {
  const reviews = [
    review(
      "new",
      ["a.ts"],
      [
        {
          title: "Slow loop",
          description: "",
          severity: "LOW",
          filePath: "a.ts",
          line: 3,
        },
        {
          title: "SQL injection",
          description: "",
          severity: "CRITICAL",
          filePath: "a.ts",
          line: 3,
        },
        {
          title: "Other file",
          description: "",
          severity: "HIGH",
          filePath: "b.ts",
          line: 1,
        },
      ],
    ),
    review(
      "old",
      ["a.ts"],
      [
        {
          title: "Old issue",
          description: "",
          severity: "HIGH",
          filePath: "a.ts",
          line: 9,
        },
      ],
    ),
  ];
  const markers = issueMarkers(reviews, "a.ts", 1);
  assert.deepEqual(
    [...markers.entries()],
    [[3, { severity: "CRITICAL", titles: ["Slow loop", "SQL injection"] }]],
  );
  assert.equal(issueMarkers(reviews, "c.ts", 1).size, 0);
});

test("issueMarkers skips diff reviews and reviews of older code", () => {
  const issue = (line: number) => ({
    title: `Line ${line}`,
    description: "",
    severity: "HIGH" as const,
    filePath: "a.ts",
    line,
  });
  const reviews = [
    // Newest: a diff review where a.ts is the "before" file (no issues for it).
    review("diff", ["a.ts", "b.ts"], [], { scope: "DIFF" }),
    review("full", ["a.ts"], [issue(4)]),
    review("old-upload", ["a.ts"], [issue(9)], { codeVersion: 0 }),
  ];
  assert.deepEqual([...issueMarkers(reviews, "a.ts", 1).keys()], [4]);
  // After a new upload (version 2) no review matches: no dots at all.
  assert.equal(issueMarkers(reviews, "a.ts", 2).size, 0);
});
