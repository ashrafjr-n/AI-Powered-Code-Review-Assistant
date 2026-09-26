import type { InsightKind } from "./types";

export type WorkspaceTab = "review" | "chat" | "insights";

const WORKSPACE_TABS: WorkspaceTab[] = ["review", "chat", "insights"];

interface WorkspaceLink {
  file?: string;
  line?: number;
  tab?: WorkspaceTab;
  chat?: string;
  /** A generated document shown in the middle pane instead of the code. */
  doc?: InsightKind;
}

// All workspace state lives in the URL, so every view can be linked, bookmarked and shared.
export function workspaceHref(
  projectId: string,
  link: WorkspaceLink = {},
): string {
  const params = new URLSearchParams();
  if (link.file) params.set("file", link.file);
  if (link.line) params.set("line", String(link.line));
  if (link.tab && link.tab !== "review") params.set("tab", link.tab);
  if (link.chat) params.set("chat", link.chat);
  if (link.doc) params.set("doc", link.doc.toLowerCase());
  const query = params.toString();
  const hash = link.line ? `#L${link.line}` : "";
  return `/projects/${projectId}${query ? `?${query}` : ""}${hash}`;
}

export function parseTab(value: string | string[] | undefined): WorkspaceTab {
  return WORKSPACE_TABS.find((tab) => tab === value) ?? "review";
}

export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const INSIGHT_KINDS: InsightKind[] = [
  "ARCHITECTURE",
  "README",
  "SETUP",
  "API_DOCS",
];

/** `?doc=api_docs` → "API_DOCS"; anything else → undefined. */
export function parseDoc(
  value: string | string[] | undefined,
): InsightKind | undefined {
  const doc = firstParam(value)?.toUpperCase();
  return INSIGHT_KINDS.find((kind) => kind === doc);
}
