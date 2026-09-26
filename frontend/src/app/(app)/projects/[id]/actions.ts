"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getProject } from "@/lib/api/projects";
import { runReview } from "@/lib/api/reviews";
import { MODE_LABEL } from "@/lib/labels";
import type { InsightKind, ReviewMode, ReviewScope } from "@/lib/types";
import { workspaceHref } from "@/lib/workspace-url";
import { sendChatMessage } from "@/mocks/chat";
import { generateInsight } from "@/mocks/insights";

export interface ActionState {
  error?: string;
}

// Server Actions are public endpoints: always confirm (via the backend) that the project
// belongs to the signed-in user before touching it.
const NOT_YOURS: ActionState = { error: "Project not found." };

// ── Review ─────────────────────────────────────────────────────────────
const MODES = Object.keys(MODE_LABEL) as ReviewMode[];
const SCOPES: ReviewScope[] = ["FILE", "FILES", "PROJECT"];

export async function runReviewAction(
  projectId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const mode = MODES.find((value) => value === formData.get("mode"));
  const scope = SCOPES.find((value) => value === formData.get("scope"));
  if (!mode) return { error: "Pick a review lens." };
  if (!scope) return { error: "Pick what to review." };

  // Friendly checks only. The backend confirms the project is yours and reads only
  // files that really exist in it.
  let filePaths: string[] = [];
  if (scope === "FILES") {
    filePaths = formData.getAll("files").map(String);
    if (filePaths.length === 0)
      return { error: "Tick at least one file in the tree." };
  } else if (scope === "FILE") {
    const current = String(formData.get("currentFile") ?? "");
    if (!current) return { error: "Open a file first." };
    filePaths = [current];
  }

  let reviewId: string;
  try {
    ({ id: reviewId } = await runReview(projectId, { mode, scope, filePaths }));
  } catch (error) {
    // 400 (no provider, bad files), 404 (not yours), 429 (limit), 502 (model failed).
    if (
      error instanceof ApiError &&
      (error.status < 500 || error.status === 502)
    )
      return { error: error.status === 404 ? NOT_YOURS.error : error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  redirect(`/projects/${projectId}/reviews/${reviewId}`);
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
