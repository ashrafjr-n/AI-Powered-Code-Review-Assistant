// MOCK (frontend-only phase). One in-memory "database" for the remaining mock modules.
// It lives in the server process and resets when the dev server restarts.
// Replaced by the NestJS API in C6 (chat) and C7 (insights), then this folder is deleted.
import type { ChatSession, Insight } from "@/lib/types";

export const db = {
  chats: [] as ChatSession[],

  insights: new Map<string, Insight[]>(),
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
