import "server-only";
import type { ChatSession } from "@/lib/types";
import { apiFetch } from "./client";

/** Newest conversation first, each with its messages (oldest first). */
export function listChatSessions(projectId: string): Promise<ChatSession[]> {
  return apiFetch<ChatSession[]>(
    `/projects/${encodeURIComponent(projectId)}/chats`,
  );
}

/** Waits for the model. sessionId null = start a new conversation. */
export async function askQuestion(
  projectId: string,
  sessionId: string | null,
  question: string,
): Promise<string> {
  const { sessionId: id } = await apiFetch<{ sessionId: string }>(
    `/projects/${encodeURIComponent(projectId)}/chats/messages`,
    {
      method: "POST",
      body: JSON.stringify({ sessionId: sessionId ?? undefined, question }),
    },
  );
  return id;
}
