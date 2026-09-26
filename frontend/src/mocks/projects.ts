// MOCK (frontend-only phase). Replaced by the projects + files API in C2/C3.
import { highestSeverity } from "@/lib/severity";
import type { ProjectFile, ProjectSummary } from "@/lib/types";
import { db, wait, type ProjectRow } from "./db";
import { crmFiles } from "./sample-code";

function toSummary(project: ProjectRow): ProjectSummary {
  const latest = db.reviews
    .filter((review) => review.projectId === project.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return {
    ...project,
    fileCount: db.files.get(project.id)?.length ?? 0,
    lastReview: latest
      ? {
          severity: highestSeverity(latest.issues),
          createdAt: latest.createdAt,
        }
      : undefined,
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  return db.projects
    .map(toSummary)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProject(id: string): Promise<ProjectSummary | null> {
  const project = db.projects.find((candidate) => candidate.id === id);
  return project ? toSummary(project) : null;
}

export async function getProjectFiles(id: string): Promise<ProjectFile[]> {
  return db.files.get(id) ?? [];
}

export async function createProject(input: {
  name: string;
  description: string;
}): Promise<ProjectSummary> {
  const project: ProjectRow = {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description,
    createdAt: new Date().toISOString(),
  };
  db.projects.push(project);
  return toSummary(project);
}

export async function deleteProject(id: string): Promise<void> {
  db.projects = db.projects.filter((project) => project.id !== id);
  db.files.delete(id);
  db.reviews = db.reviews.filter((review) => review.projectId !== id);
  db.chats = db.chats.filter((chat) => chat.projectId !== id);
  db.insights.delete(id);
}

// The real backend unzips the upload. The mock pretends the ZIP held the CRM sample.
export async function uploadZip(projectId: string): Promise<number> {
  await wait(900);
  db.files.set(projectId, crmFiles);
  return crmFiles.length;
}
