import assert from "node:assert/strict";
import { test } from "node:test";
import { highestSeverity, reviewVerdict } from "./severity.ts";
import type { ReviewIssue } from "./types";

const issue = (severity: ReviewIssue["severity"]): ReviewIssue => ({
  title: "t",
  description: "d",
  severity,
});

test("highestSeverity picks the worst level, null when empty", () => {
  assert.equal(highestSeverity([issue("LOW"), issue("HIGH")]), "HIGH");
  assert.equal(highestSeverity([]), null);
});

test("reviewVerdict wording follows the worst severity", () => {
  assert.equal(
    reviewVerdict([issue("CRITICAL"), issue("LOW")]),
    "1 critical issue should block shipping.",
  );
  assert.equal(
    reviewVerdict([issue("HIGH"), issue("HIGH")]),
    "No blockers. 2 high-severity issues to fix soon.",
  );
  assert.equal(
    reviewVerdict([issue("MEDIUM")]),
    "No blocking issues. 1 suggestion.",
  );
  assert.equal(
    reviewVerdict([]),
    "Clean. Nothing worth flagging in this lens.",
  );
});
