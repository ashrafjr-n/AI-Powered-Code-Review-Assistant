// MOCK (until C3): project files. Projects themselves are real (lib/api/projects.ts).
import type { ProjectFile } from "@/lib/types";
import { db, wait } from "./db";
import { crmFiles } from "./sample-code";

export async function getProjectFiles(id: string): Promise<ProjectFile[]> {
  return db.files.get(id) ?? [];
}

// The real backend unzips the upload. The mock pretends the ZIP held the CRM sample.
export async function uploadZip(projectId: string): Promise<number> {
  await wait(900);
  db.files.set(projectId, crmFiles);
  return crmFiles.length;
}
