import assert from "node:assert/strict";
import { test } from "node:test";
import { groupIssuesByFile } from "./issue-groups.ts";
import type { ReviewIssue } from "./types";

const issue = (
  severity: ReviewIssue["severity"],
  filePath?: string,
  line?: number,
): ReviewIssue => ({
  title: `${severity} ${filePath}`,
  description: "",
  severity,
  filePath,
  line,
});

const issues = [
  issue("LOW", "src/a.ts", 9),
  issue("HIGH", "src/b.ts", 3),
  issue("MEDIUM"),
  issue("CRITICAL", "src/a.ts", 20),
];

test("groupIssuesByFile puts the worst file first and general issues last", () => {
  const groups = groupIssuesByFile(issues);
  assert.deepEqual(
    groups.map((g) => [g.filePath, g.issues.map((i) => i.severity)]),
    [
      ["src/a.ts", ["CRITICAL", "LOW"]],
      ["src/b.ts", ["HIGH"]],
      [null, ["MEDIUM"]],
    ],
  );
});

test("groupIssuesByFile can show one severity only", () => {
  const groups = groupIssuesByFile(issues, "HIGH");
  assert.deepEqual(
    groups.map((g) => g.filePath),
    ["src/b.ts"],
  );
});
