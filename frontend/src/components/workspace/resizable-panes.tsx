"use client";

import { useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
} from "react";
import {
  clampWidth,
  DEFAULT_WIDTHS,
  formatPaneCookie,
  PANE_COOKIE,
  PANE_LIMITS,
  type Pane,
  type PaneWidths,
} from "@/lib/pane-layout";

interface ResizablePanesProps {
  /** From the cookie, read on the server: the first paint already has the user's layout. */
  initial: PaneWidths;
  tree: ReactNode;
  code: ReactNode;
  panel: ReactNode;
}

const PANE_ID: Record<Pane, string> = {
  tree: "workspace-tree",
  panel: "workspace-panel",
};
const LABEL: Record<Pane, string> = {
  tree: "Resize the file tree",
  panel: "Resize the review, chat and insights panel",
};

function save(widths: PaneWidths) {
  document.cookie = `${PANE_COOKIE}=${formatPaneCookie(widths)}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Desktop workspace: tree · code · panel. Dragging a gap moves the width between a side
 * pane and the code pane (one grows, the other shrinks; nothing overlaps). Keyboard:
 * focus a gap, arrows move it (Shift = faster), Home/End = smallest/largest.
 * Double-click a gap to reset. On small screens the panes stack as before.
 */
export function ResizablePanes({
  initial,
  tree,
  code,
  panel,
}: ResizablePanesProps) {
  const [widths, setWidths] = useState(initial);
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pane: Pane; startX: number; start: number } | null>(
    null,
  );

  function resize(pane: Pane, width: number): PaneWidths {
    const rowWidth = rowRef.current?.clientWidth ?? Infinity;
    const next = {
      ...widths,
      [pane]: clampWidth(pane, width, widths, rowWidth),
    };
    setWidths(next);
    return next;
  }

  function onPointerDown(pane: Pane, event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pane, startX: event.clientX, start: widths[pane] };
    // One cursor everywhere and no text selection while dragging (globals.css).
    document.documentElement.setAttribute("data-resizing", "");
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const { pane, startX, start } = drag.current;
    const moved = event.clientX - startX;
    // The tree is left of its gap (grows to the right); the panel is right of it.
    resize(pane, pane === "tree" ? start + moved : start - moved);
  }

  function endDrag() {
    if (!drag.current) return;
    drag.current = null;
    document.documentElement.removeAttribute("data-resizing");
    save(widths);
  }

  function onKeyDown(pane: Pane, event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 64 : 16;
    // Arrows move the gap; for the panel, moving left makes it wider.
    const direction = pane === "tree" ? 1 : -1;
    const moves: Record<string, number> = {
      ArrowLeft: widths[pane] - step * direction,
      ArrowRight: widths[pane] + step * direction,
      Home: PANE_LIMITS[pane].min,
      End: PANE_LIMITS[pane].max,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    save(resize(pane, moves[event.key]));
  }

  function reset() {
    setWidths(DEFAULT_WIDTHS);
    save(DEFAULT_WIDTHS);
  }

  function handle(pane: Pane) {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={LABEL[pane]}
        aria-controls={PANE_ID[pane]}
        aria-valuenow={widths[pane]}
        aria-valuemin={PANE_LIMITS[pane].min}
        aria-valuemax={PANE_LIMITS[pane].max}
        tabIndex={0}
        title="Drag to resize · double-click to reset"
        onPointerDown={(event) => onPointerDown(pane, event)}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={(event) => onKeyDown(pane, event)}
        onDoubleClick={reset}
        className="group/handle hidden cursor-col-resize touch-none items-center justify-center rounded-sm lg:flex"
      >
        {/* A thin line, brighter on hover, focus and while dragging. */}
        <span
          aria-hidden
          className="h-full w-px bg-transparent transition-colors group-hover/handle:bg-line-strong group-focus-visible/handle:bg-silver-300 group-active/handle:bg-silver-300"
        />
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      style={
        {
          "--tree": `${widths.tree}px`,
          "--panel": `${widths.panel}px`,
        } as CSSProperties
      }
      // The % caps (same as PANE_LIMITS.maxShare) keep the code pane usable when the
      // window gets narrower than the saved layout.
      className="grid gap-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[560px] lg:grid-cols-[min(var(--tree),30%)_16px_minmax(0,1fr)_16px_min(var(--panel),45%)] lg:gap-0"
    >
      <div id={PANE_ID.tree} className="min-h-0 min-w-0 lg:grid">
        {tree}
      </div>
      {handle("tree")}
      <div className="min-h-0 min-w-0 lg:grid">{code}</div>
      {handle("panel")}
      <div id={PANE_ID.panel} className="min-h-0 min-w-0 lg:grid">
        {panel}
      </div>
    </div>
  );
}
