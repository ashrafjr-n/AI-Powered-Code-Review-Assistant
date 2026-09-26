import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDiff } from "./diff-lines.ts";

test("parseDiff numbers before and after lines separately", () => {
  const rows = parseDiff(
    [
      "--- a.ts",
      "+++ b.ts",
      "@@ -4,3 +4,3 @@",
      " const a = 1;",
      "-if (!user) throw err;",
      "+log(password);",
      " login(user);",
    ].join("\n"),
  );
  assert.deepEqual(rows, [
    { kind: "hunk", text: "@@ -4,3 +4,3 @@" },
    { kind: "same", text: "const a = 1;", oldLine: 4, newLine: 4 },
    { kind: "del", text: "if (!user) throw err;", oldLine: 5 },
    { kind: "add", text: "log(password);", newLine: 5 },
    { kind: "same", text: "login(user);", oldLine: 6, newLine: 6 },
  ]);
});
