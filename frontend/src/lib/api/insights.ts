import "server-only";
import type { Insight, InsightKind } from "@/lib/types";
import { apiFetch } from "./client";

/** Saved architecture overview + docs of a project (one per kind). */
export function listInsights(projectId: string): Promise<Insight[]> {
  return apiFetch<Insight[]>(
    `/projects/${encodeURIComponent(projectId)}/insights`,
  );
}

/** Waits for the model; replaces the saved document of this kind. */
export function generateInsight(
  projectId: string,
  kind: InsightKind,
): Promise<Insight> {
  return apiFetch<Insight>(
    `/projects/${encodeURIComponent(projectId)}/insights`,
    { method: "POST", body: JSON.stringify({ kind }) },
  );
}
