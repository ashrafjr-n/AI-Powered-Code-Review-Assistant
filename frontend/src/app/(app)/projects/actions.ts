"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import { createProject, deleteProject } from "@/lib/api/projects";

export interface ProjectFormState {
  ok: boolean;
  error?: string;
}

// Server-side checks. The form also uses native validation, but that is only UX.
export async function createProjectAction(
  formData: FormData,
): Promise<ProjectFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || name.length > 100) {
    return { ok: false, error: "Name must be 1 to 100 characters." };
  }
  if (description.length > 500) {
    return { ok: false, error: "Description must be 500 characters or less." };
  }

  try {
    await createProject({ name, description });
  } catch (error) {
    // 400 (validation) or 429 (rate limit): show it in the form, not the error page.
    if (error instanceof ApiError && error.status < 500)
      return { ok: false, error: error.message };
    throw error;
  }
  revalidatePath("/projects");
  return { ok: true };
}

/** Returns an error message to show in the dialog, or nothing when the project is gone. */
export async function deleteProjectAction(
  id: string,
): Promise<string | undefined> {
  try {
    await deleteProject(id);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status >= 500) throw error;
    // 404 = already deleted (e.g. in another tab): the goal is reached.
    if (error.status !== 404) return error.message;
  }
  revalidatePath("/projects");
}
