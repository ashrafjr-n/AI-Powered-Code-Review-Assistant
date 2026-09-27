import "server-only";
import type { ChatSession, ChatSessionSummary } from "@/lib/types";
import { ApiError, apiFetch } from "./client";

/** Newest conversation first, titles only. */
export function listChatSessions(
  projectId: string,
): Promise<ChatSessionSummary[]> {
  return apiFetch<ChatSessionSummary[]>(
    `/projects/${encodeURIComponent(projectId)}/chats`,
  );
}

/** One conversation with its messages; null when it doesn't exist (or isn't yours). */
export async function getChatSession(
  projectId: string,
  sessionId: string,
): Promise<ChatSession | null> {
  try {
    return await apiFetch<ChatSession>(
      `/projects/${encodeURIComponent(projectId)}/chats/${encodeURIComponent(sessionId)}`,
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

/** Waits for the model. sessionId null = start a new conversation. */
export async function askQuestion(
  projectId: string,
  sessionId: string | null,
  question: string,
  /** The file open in the workspace, always sent as context. */
  currentFile?: string,
): Promise<string> {
  const { sessionId: id } = await apiFetch<{ sessionId: string }>(
    `/projects/${encodeURIComponent(projectId)}/chats/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        sessionId: sessionId ?? undefined,
        question,
        currentFile,
      }),
    },
  );
  return id;
}
