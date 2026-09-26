// Run: npm test (Node's built-in test runner, no extra packages).
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFileTree } from "./file-tree.ts";

test("builds nested folders, folders first, sorted A→Z", () => {
  const tree = buildFileTree([
    { path: "src/routes/users.ts", size: 10 },
    { path: "README.md", size: 5 },
    { path: "src/index.ts", size: 3 },
    { path: "src/routes/auth.ts", size: 7 },
    { path: "package.json", size: 2 },
  ]);

  assert.deepEqual(
    tree.map((node) => node.name),
    ["src", "package.json", "README.md"],
  );
  const src = tree[0];
  assert.ok(src.type === "folder");
  assert.equal(src.path, "src");
  assert.deepEqual(
    src.children.map((node) => node.name),
    ["routes", "index.ts"],
  );
  const routes = src.children[0];
  assert.ok(routes.type === "folder");
  assert.deepEqual(
    routes.children.map((node) => node.path),
    ["src/routes/auth.ts", "src/routes/users.ts"],
  );
});

test("returns an empty tree for no files", () => {
  assert.deepEqual(buildFileTree([]), []);
});
