import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampWidth,
  DEFAULT_WIDTHS,
  formatPaneCookie,
  parsePaneCookie,
} from "./pane-layout.ts";

test("parsePaneCookie reads saved widths and ignores bad values", () => {
  assert.deepEqual(parsePaneCookie("260.420"), { tree: 260, panel: 420 });
  assert.deepEqual(
    parsePaneCookie(formatPaneCookie({ tree: 300, panel: 500 })),
    {
      tree: 300,
      panel: 500,
    },
  );
  // Out of range → clamped; garbage → defaults.
  assert.deepEqual(parsePaneCookie("5.9999"), { tree: 180, panel: 760 });
  assert.deepEqual(parsePaneCookie("abc"), DEFAULT_WIDTHS);
  assert.deepEqual(parsePaneCookie(undefined), DEFAULT_WIDTHS);
});

test("clampWidth leaves room for the code pane and the other pane", () => {
  const widths = { tree: 240, panel: 360 };
  // 1440 row: tree max = min(560, 30% = 432, 1440 - 360 - 360 - 32 = 688) = 432.
  assert.equal(clampWidth("tree", 900, widths, 1440), 432);
  // 1100 row: panel max = min(760, 495, 1100 - 240 - 360 - 32 = 468) = 468.
  assert.equal(clampWidth("panel", 700, widths, 1100), 468);
  assert.equal(clampWidth("tree", 10, widths, 1440), 180);
});
