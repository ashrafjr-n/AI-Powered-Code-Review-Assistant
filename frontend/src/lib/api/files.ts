import "server-only";
import type { FileEntry, ProjectFile } from "@/lib/types";
import { ApiError, apiFetch } from "./client";

// Uploads don't live here: the browser sends the ZIP itself (see upload-dropzone.tsx).

export function listFiles(projectId: string): Promise<FileEntry[]> {
  return apiFetch<FileEntry[]>(
    `/projects/${encodeURIComponent(projectId)}/files`,
  );
}

/** null when the file doesn't exist in this project. */
export async function getFile(
  projectId: string,
  path: string,
): Promise<ProjectFile | null> {
  try {
    return await apiFetch<ProjectFile>(
      `/projects/${encodeURIComponent(projectId)}/files/content?${new URLSearchParams({ path })}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
