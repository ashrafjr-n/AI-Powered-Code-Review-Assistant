import "server-only";
import type { FileEntry, ProjectFile } from "@/lib/types";
import { ApiError, apiFetch } from "./client";

// Uploads don't live here: the browser sends the ZIP itself (see upload-dropzone.tsx).

/** null when the project doesn't exist, isn't yours, or the id is malformed (like getProject). */
export async function listFiles(
  projectId: string,
): Promise<FileEntry[] | null> {
  try {
    return await apiFetch<FileEntry[]>(
      `/projects/${encodeURIComponent(projectId)}/files`,
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    )
      return null;
    throw error;
  }
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
