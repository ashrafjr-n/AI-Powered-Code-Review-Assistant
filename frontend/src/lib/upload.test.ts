import assert from "node:assert/strict";
import { test } from "node:test";
import { strToU8, unzipSync, zipSync } from "fflate";
import { slimZip, zipProblem } from "./upload.ts";

test("slimZip keeps source files and drops dependencies, build output and binaries", () => {
  const zip = zipSync({
    "shop/src/app.ts": strToU8("export const a = 1;"),
    "shop/README.md": strToU8("# Shop"),
    "shop/node_modules/react/index.js": strToU8("x".repeat(100_000)),
    "shop/.next/cache/a.js": strToU8("cache"),
    "shop/package-lock.json": strToU8("{}"),
    "shop/.vite/deps/react.js": strToU8("cache"),
    "shop/public/app.min.js": strToU8("x"),
    "shop/logo.png": new Uint8Array([137, 80, 78, 71, 0, 1]),
  });

  const result = slimZip(zip);
  assert.ok(result.ok);
  assert.equal(result.fileCount, 2);
  assert.deepEqual(Object.keys(unzipSync(result.zip)).sort(), [
    "shop/README.md",
    "shop/src/app.ts",
  ]);
});

test("slimZip explains broken or empty archives", () => {
  assert.deepEqual(slimZip(strToU8("not a zip")), {
    ok: false,
    error: "This file is not a valid ZIP archive.",
  });
  const onlyDeps = zipSync({ "node_modules/a.js": strToU8("a") });
  assert.equal(slimZip(onlyDeps).ok, false);
});

test("zipProblem allows big ZIPs up to 200 MB", () => {
  assert.equal(zipProblem("a.zip", 150 * 1024 * 1024), null);
  assert.equal(
    zipProblem("a.zip", 201 * 1024 * 1024),
    "The ZIP is larger than 200 MB.",
  );
  assert.equal(zipProblem("a.rar", 10), "Choose a .zip file.");
});
