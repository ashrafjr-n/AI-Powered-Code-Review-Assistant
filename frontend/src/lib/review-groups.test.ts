import assert from "node:assert/strict";
import { test } from "node:test";
import { groupReviewsByProject } from "./review-groups.ts";
import type { ReviewListItem } from "./types";

const review = (
  id: string,
  projectId: string,
  createdAt: string,
  severity?: "CRITICAL" | "LOW",
): ReviewListItem => ({
  id,
  projectId,
  projectName: `Project ${projectId}`,
  mode: "SECURITY",
  scope: "PROJECT",
  diff: null,
  filePaths: [],
  summary: "",
  issues: severity ? [{ title: "t", description: "", severity }] : [],
  recommendations: [],
  providerName: "p",
  model: "m",
  createdAt,
});

test("groupReviewsByProject keeps newest-first order and the latest severity", () => {
  const groups = groupReviewsByProject([
    review("r3", "b", "2026-09-26T10:00:00Z", "LOW"),
    review("r2", "a", "2026-09-26T09:00:00Z"),
    review("r1", "b", "2026-09-25T09:00:00Z", "CRITICAL"),
  ]);
  assert.deepEqual(
    groups.map((g) => [g.projectId, g.reviews.map((r) => r.id)]),
    [
      ["b", ["r3", "r1"]],
      ["a", ["r2"]],
    ],
  );
  assert.equal(groups[0].latestSeverity, "LOW");
  assert.equal(groups[1].latestSeverity, null);
});
