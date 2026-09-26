// MOCK (frontend-only phase). Replaced by the insights API (architecture + docs) in C7.
import { listFiles } from "@/lib/api/files";
import type { Insight, InsightKind } from "@/lib/types";
import { db, wait } from "./db";

export async function listInsights(projectId: string): Promise<Insight[]> {
  return db.insights.get(projectId) ?? [];
}

// Builds a plausible document from the real file list, so the output matches the project.
function draft(
  kind: InsightKind,
  projectName: string,
  paths: string[],
): string {
  const folders = [
    ...new Set(
      paths
        .filter((p) => p.includes("/"))
        .map((p) => p.split("/").slice(0, -1).join("/")),
    ),
  ];
  switch (kind) {
    case "ARCHITECTURE":
      return [
        `${projectName}: architecture overview (sample)`,
        "",
        "Layers",
        ...folders.map((folder) => `  - ${folder}/`),
        "",
        `Entry point: ${paths.find((p) => /index|main|page/.test(p)) ?? paths[0]}`,
        `Files analysed: ${paths.length}`,
      ].join("\n");
    case "README":
      return [
        `# ${projectName}`,
        "",
        "## Getting started",
        "",
        "    npm install",
        "    npm run dev",
        "",
        "## Project structure",
        "",
        ...folders.map((folder) => `- \`${folder}/\``),
      ].join("\n");
    case "SETUP":
      return [
        `# Setup guide: ${projectName}`,
        "",
        "1. Install Node.js 22 or newer.",
        "2. Copy `.env.example` to `.env` and fill in the values.",
        "3. Run `npm install`.",
        "4. Run `npm run dev`.",
      ].join("\n");
    case "API_DOCS":
      return [
        `# API reference: ${projectName}`,
        "",
        ...paths
          .filter((p) => p.includes("routes/"))
          .map(
            (p) =>
              `## ${p
                .split("/")
                .pop()
                ?.replace(/\.\w+$/, "")}\n\nSee \`${p}\`.`,
          ),
      ].join("\n");
  }
}

export async function generateInsight(
  projectId: string,
  projectName: string,
  kind: InsightKind,
): Promise<void> {
  await wait(1200);
  const paths = (await listFiles(projectId)).map((file) => file.path);
  const insight: Insight = {
    kind,
    content: draft(kind, projectName, paths),
    createdAt: new Date().toISOString(),
  };
  const others = (db.insights.get(projectId) ?? []).filter(
    (item) => item.kind !== kind,
  );
  db.insights.set(projectId, [insight, ...others]);
}
