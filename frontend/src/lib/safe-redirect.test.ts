import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNextPath } from "./safe-redirect.ts";

test("keeps internal paths", () => {
  assert.equal(
    safeNextPath("/projects/abc?tab=chat"),
    "/projects/abc?tab=chat",
  );
});

test("blocks open redirects and junk", () => {
  for (const value of [
    "//evil.com",
    "https://evil.com",
    "/\\evil.com",
    "evil",
    "",
    null,
    42,
  ]) {
    assert.equal(safeNextPath(value), "/projects");
  }
});
