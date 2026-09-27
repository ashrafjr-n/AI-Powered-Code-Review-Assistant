import assert from "node:assert/strict";
import { test } from "node:test";
import { markersFor } from "./issue-markers.ts";
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

test("markersFor keeps the worst severity per line and only this file", () => {
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
  const markers = markersFor(reviews[0].issues, "a.ts");
  assert.deepEqual(
    [...markers.entries()],
    [[3, { severity: "CRITICAL", titles: ["Slow loop", "SQL injection"] }]],
  );
  assert.equal(markersFor(reviews[0].issues, "c.ts").size, 0);
});
