"use server";

import { revalidatePath } from "next/cache";
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

  await createProject({ name, description });
  revalidatePath("/projects");
  return { ok: true };
}

export async function deleteProjectAction(id: string): Promise<void> {
  await deleteProject(id);
  revalidatePath("/projects");
}
