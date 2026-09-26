// MOCK (frontend-only phase). Replaced by the chat API (keyword retrieval + the model) in C6.
import type { ChatMessage, ChatSession } from "@/lib/types";
import { db, wait } from "./db";

export async function listChatSessions(
  projectId: string,
): Promise<ChatSession[]> {
  return db.chats
    .filter((chat) => chat.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function message(
  role: ChatMessage["role"],
  content: string,
  sources?: string[],
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    sources,
    createdAt: new Date().toISOString(),
  };
}

// Simple keyword retrieval: score each file by how often the question's words appear
// in its path and content, keep the top 3. The real version does this on the backend.
function relevantFiles(projectId: string, question: string): string[] {
  const words = question.toLowerCase().match(/[a-z_]{4,}/g) ?? [];
  return (db.files.get(projectId) ?? [])
    .map((file) => {
      const text = `${file.path} ${file.content}`.toLowerCase();
      return {
        path: file.path,
        score: words.reduce(
          (sum, word) => sum + text.split(word).length - 1,
          0,
        ),
      };
    })
    .filter((file) => file.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((file) => file.path);
}

/** Adds the question and a reply. Creates the session when sessionId is null. Returns the session id. */
export async function sendChatMessage(
  projectId: string,
  sessionId: string | null,
  question: string,
): Promise<string> {
  await wait(1200);
  let session = db.chats.find(
    (chat) => chat.id === sessionId && chat.projectId === projectId,
  );
  if (!session) {
    session = {
      id: crypto.randomUUID(),
      projectId,
      title: question.length > 60 ? `${question.slice(0, 57)}…` : question,
      createdAt: new Date().toISOString(),
      messages: [],
    };
    db.chats.push(session);
  }
  const sources = relevantFiles(projectId, question);
  const answer = sources.length
    ? `The files most related to your question are ${sources.join(", ")}. (Sample answer: once a model is connected, it answers using these files as context.)`
    : "I couldn't find files that match your question. Try naming a feature, a function or a file. (Sample answer: once a model is connected, it answers here.)";
  session.messages.push(
    message("USER", question),
    message("ASSISTANT", answer, sources),
  );
  return session.id;
}
