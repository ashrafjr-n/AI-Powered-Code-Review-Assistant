// Workspace pane widths on desktop: file tree (left) and Review/Chat/Insights panel
// (right). The code pane in the middle takes the rest. Saved in a cookie, so the server
// renders the user's layout on the first paint (no jump after the page loads).

export const PANE_COOKIE = "redline-panes";

export type Pane = "tree" | "panel";
export type PaneWidths = Record<Pane, number>;

export const PANE_LIMITS: Record<
  Pane,
  {
    min: number;
    max: number;
    default: number;
    /** Share of the row. */ maxShare: number;
  }
> = {
  tree: { min: 180, max: 560, default: 240, maxShare: 0.3 },
  panel: { min: 300, max: 760, default: 360, maxShare: 0.45 },
};

/** The code pane never gets narrower than this while dragging. */
export const CODE_MIN = 360;
/** The gap between cards, where the drag handles live. */
export const HANDLE_PX = 16;

export const DEFAULT_WIDTHS: PaneWidths = {
  tree: PANE_LIMITS.tree.default,
  panel: PANE_LIMITS.panel.default,
};

/**
 * Keeps a width inside its limits. With `rowWidth`, also leaves room for the other
 * pane and the code pane, and respects the share cap the CSS uses.
 */
export function clampWidth(
  pane: Pane,
  width: number,
  widths: PaneWidths,
  rowWidth = Infinity,
): number {
  const limits = PANE_LIMITS[pane];
  const other = pane === "tree" ? widths.panel : widths.tree;
  const max = Math.min(
    limits.max,
    rowWidth * limits.maxShare,
    rowWidth - other - CODE_MIN - 2 * HANDLE_PX,
  );
  return Math.round(Math.max(limits.min, Math.min(width, max)));
}

/** "260.420" → widths. Anything else (missing, edited by hand) → defaults. */
export function parsePaneCookie(value: string | undefined): PaneWidths {
  const match = /^(\d{1,4})\.(\d{1,4})$/.exec(value ?? "");
  if (!match) return DEFAULT_WIDTHS;
  const widths = { tree: Number(match[1]), panel: Number(match[2]) };
  return {
    tree: clampWidth("tree", widths.tree, widths),
    panel: clampWidth("panel", widths.panel, widths),
  };
}

export function formatPaneCookie(widths: PaneWidths): string {
  return `${widths.tree}.${widths.panel}`;
}
