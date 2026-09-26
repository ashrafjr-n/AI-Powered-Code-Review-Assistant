"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { askQuestion } from "@/lib/api/chat";
import { ApiError } from "@/lib/api/client";
import { generateInsight } from "@/lib/api/insights";
import { runReview } from "@/lib/api/reviews";
import { MODE_LABEL } from "@/lib/labels";
import type {
  DemoNotice,
  InsightKind,
  ReviewMode,
  ReviewScope,
} from "@/lib/types";
import { workspaceHref } from "@/lib/workspace-url";

export interface ActionState {
  error?: string;
  /** The free demo can't answer (limit or busy): show the help panel instead. */
  demo?: DemoNotice;
}

function demoNotice(error: ApiError): DemoNotice | undefined {
  const { code, reason, resetsAt } = error.details;
  if (code === "DEMO_BUSY") return { kind: "busy" };
  if (code === "DEMO_LIMIT")
    return { kind: reason === "site" ? "site" : "user", resetsAt };
  return undefined;
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
    const demo = error instanceof ApiError ? demoNotice(error) : undefined;
    if (demo) return { demo };
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
export interface ChatActionState extends ActionState {
  /** Given back after an error, so the textarea keeps what the user typed. */
  question?: string;
}

export async function sendChatAction(
  projectId: string,
  sessionId: string | null,
  _previous: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  const question = String(formData.get("question") ?? "").trim();
  if (!question) return { error: "Write a question first." };
  if (question.length > 2000)
    return { error: "Keep questions under 2000 characters.", question };

  // The backend checks that the project (and conversation) are yours.
  let id: string;
  try {
    id = await askQuestion(projectId, sessionId, question);
  } catch (error) {
    const demo = error instanceof ApiError ? demoNotice(error) : undefined;
    if (demo) return { demo, question };
    // 400 (no files / no provider), 404 (not yours), 429 (limit), 502 (model failed).
    if (
      error instanceof ApiError &&
      (error.status < 500 || error.status === 502)
    )
      return {
        error: error.status === 404 ? NOT_YOURS.error : error.message,
        question,
      };
    throw error;
  }
  // Layout too: the provider pill shows how many demo requests are left.
  revalidatePath("/", "layout");
  if (id !== sessionId)
    redirect(workspaceHref(projectId, { tab: "chat", chat: id }));
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
  const kind = INSIGHT_KINDS.find((value) => value === formData.get("kind"));
  if (!kind) return { error: "Pick what to generate." };

  // The backend checks the project is yours and counts demo requests.
  try {
    await generateInsight(projectId, kind);
  } catch (error) {
    const demo = error instanceof ApiError ? demoNotice(error) : undefined;
    if (demo) return { demo };
    if (
      error instanceof ApiError &&
      (error.status < 500 || error.status === 502)
    )
      return { error: error.status === 404 ? NOT_YOURS.error : error.message };
    throw error;
  }
  // Layout too: the provider pill shows how many demo requests are left.
  revalidatePath("/", "layout");
  return {};
}
