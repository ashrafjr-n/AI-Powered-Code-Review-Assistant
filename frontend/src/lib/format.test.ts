import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTimeLeft } from "./format.ts";

test("formatTimeLeft shows hours and minutes until the reset", () => {
  const now = Date.parse("2026-09-26T18:48:30Z");
  assert.equal(formatTimeLeft("2026-09-27T00:00:00Z", now), "5h 11m");
  assert.equal(formatTimeLeft("2026-09-26T19:00:00Z", now), "11m");
  assert.equal(
    formatTimeLeft("2026-09-26T18:49:00Z", now),
    "less than a minute",
  );
});
