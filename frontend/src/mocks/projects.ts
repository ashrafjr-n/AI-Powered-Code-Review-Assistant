// MOCK (frontend-only phase). An in-memory list on the server, replaced by the projects API in C2.
// It resets when the dev server restarts.
import type { ProjectSummary } from "@/lib/types";

let projects: ProjectSummary[] = [
  {
    id: "p-crm",
    name: "CRM Backend",
    description: "Express + PostgreSQL API for contacts, deals and invoices.",
    createdAt: "2026-09-24T10:02:00.000Z",
    fileCount: 86,
    lastReview: { severity: "CRITICAL", createdAt: "2026-09-26T09:14:00.000Z" },
  },
  {
    id: "p-portfolio",
    name: "Portfolio Website",
    description: "Next.js personal site with a blog and a contact form.",
    createdAt: "2026-09-22T15:40:00.000Z",
    fileCount: 41,
    lastReview: { severity: "MEDIUM", createdAt: "2026-09-25T18:30:00.000Z" },
  },
  {
    id: "p-dashboard",
    name: "Internal Dashboard",
    description: "",
    createdAt: "2026-09-20T08:15:00.000Z",
    fileCount: 0,
  },
];

export async function listProjects(): Promise<ProjectSummary[]> {
  return [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createProject(input: {
  name: string;
  description: string;
}): Promise<ProjectSummary> {
  const project: ProjectSummary = {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description,
    createdAt: new Date().toISOString(),
    fileCount: 0,
  };
  projects = [project, ...projects];
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  projects = projects.filter((project) => project.id !== id);
}
