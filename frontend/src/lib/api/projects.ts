import "server-only";
import { cache } from "react";
import type { ProjectSummary } from "@/lib/types";
import { ApiError, apiFetch } from "./client";

export function listProjects(): Promise<ProjectSummary[]> {
  return apiFetch<ProjectSummary[]>("/projects");
}

/**
 * null when the project doesn't exist, isn't yours, or the id is malformed.
 * cache(): the page, its metadata and the header slot share one request.
 */
export const getProject = cache(
  async (id: string): Promise<ProjectSummary | null> => {
    try {
      return await apiFetch<ProjectSummary>(
        `/projects/${encodeURIComponent(id)}`,
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      )
        return null;
      throw error;
    }
  },
);

export function createProject(input: { name: string; description: string }) {
  return apiFetch<ProjectSummary>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
