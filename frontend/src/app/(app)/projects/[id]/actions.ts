"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProject } from "@/lib/api/projects";
import { MODE_LABEL } from "@/lib/labels";
import type { InsightKind, ReviewMode, ReviewScope } from "@/lib/types";
import { zipProblem } from "@/lib/upload";
import { workspaceHref } from "@/lib/workspace-url";
import { sendChatMessage } from "@/mocks/chat";
import { generateInsight } from "@/mocks/insights";
import { getProjectFiles, uploadZip } from "@/mocks/projects";
import { runReview } from "@/mocks/reviews";

export interface ActionState {
  error?: string;
}

// Server Actions are public endpoints: always confirm (via the backend) that the project
// belongs to the signed-in user before touching it.
const NOT_YOURS: ActionState = { error: "Project not found." };

// ── Upload ─────────────────────────────────────────────────────────────
// MOCK (until C3): receives only the file name and size. The real upload sends the ZIP
// straight from the browser to the backend (multipart), not through a Server Action,
// because Server Actions accept 1 MB bodies by default.
export async function uploadZipAction(
  projectId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await getProject(projectId))) return NOT_YOURS;
  const name = String(formData.get("fileName") ?? "");
  const size = Number(formData.get("fileSize") ?? 0);
  const problem = zipProblem(name, size);
  if (problem) return { error: problem };

  await uploadZip(projectId);
  revalidatePath(`/projects/${projectId}`);
  return {};
}

// ── Review ─────────────────────────────────────────────────────────────
const MODES = Object.keys(MODE_LABEL) as ReviewMode[];

export async function runReviewAction(
  projectId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await getProject(projectId))) return NOT_YOURS;
  const mode = MODES.find((value) => value === formData.get("mode"));
  const scope = formData.get("scope");
  if (!mode) return { error: "Pick a review lens." };

  // Never trust paths from the browser: keep only files that exist in this project.
  const projectPaths = (await getProjectFiles(projectId)).map(
    (file) => file.path,
  );
  let filePaths: string[];
  let reviewScope: ReviewScope;
  if (scope === "PROJECT") {
    filePaths = projectPaths;
    reviewScope = "PROJECT";
  } else if (scope === "FILES") {
    filePaths = formData
      .getAll("files")
      .map(String)
      .filter((path) => projectPaths.includes(path));
    if (filePaths.length === 0)
      return { error: "Tick at least one file in the tree." };
    reviewScope = filePaths.length === 1 ? "FILE" : "FILES";
  } else {
    const current = String(formData.get("currentFile") ?? "");
    if (!projectPaths.includes(current)) return { error: "Open a file first." };
    filePaths = [current];
    reviewScope = "FILE";
  }

  const review = await runReview({
    projectId,
    mode,
    scope: reviewScope,
    filePaths,
  });
  revalidatePath("/", "layout");
  redirect(`/projects/${projectId}/reviews/${review.id}`);
}

// ── Chat ───────────────────────────────────────────────────────────────
export async function sendChatAction(
  projectId: string,
  sessionId: string | null,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await getProject(projectId))) return NOT_YOURS;
  const question = String(formData.get("question") ?? "").trim();
  if (!question) return { error: "Write a question first." };
  if (question.length > 2000)
    return { error: "Keep questions under 2000 characters." };

  const id = await sendChatMessage(projectId, sessionId, question);
  if (id !== sessionId)
    redirect(workspaceHref(projectId, { tab: "chat", chat: id }));
  revalidatePath(`/projects/${projectId}`);
  return {};
}

// ── Insights (bonus: architecture + documentation) ─────────────────────
const INSIGHT_KINDS: InsightKind[] = [
  "ARCHITECTURE",
  "README",
  "SETUP",
  "API_DOCS",
];

export async function generateInsightAction(
  projectId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const project = await getProject(projectId);
  if (!project) return NOT_YOURS;
  const kind = INSIGHT_KINDS.find((value) => value === formData.get("kind"));
  if (!kind) return { error: "Pick what to generate." };
  await generateInsight(projectId, project.name, kind);
  revalidatePath(`/projects/${projectId}`);
  return {};
}
