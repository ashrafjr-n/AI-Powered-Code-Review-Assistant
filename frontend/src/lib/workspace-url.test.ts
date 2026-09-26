import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDoc, workspaceHref } from "./workspace-url.ts";

test("an open document round-trips through the URL", () => {
  const href = workspaceHref("p1", { tab: "insights", doc: "API_DOCS" });
  assert.equal(href, "/projects/p1?tab=insights&doc=api_docs");
  assert.equal(parseDoc("api_docs"), "API_DOCS");
  assert.equal(parseDoc("nope"), undefined);
  assert.equal(parseDoc(undefined), undefined);
});
