// Domain types. They mirror the backend Prisma enums/models (backend/prisma/schema.prisma).

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ReviewMode = "SECURITY" | "PERFORMANCE" | "QUALITY";

export type ReviewScope = "FILE" | "FILES" | "PROJECT";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  fileCount: number;
  /** Highest severity of the latest review; null = clean review; undefined = never reviewed. */
  lastReview?: { severity: Severity | null; createdAt: string };
}

export interface ProjectFile {
  path: string;
  size: number;
  content: string;
}

export interface ReviewIssue {
  title: string;
  description: string;
  severity: Severity;
  filePath?: string;
  line?: number;
}

export interface Review {
  id: string;
  projectId: string;
  mode: ReviewMode;
  scope: ReviewScope;
  filePaths: string[];
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  providerName: string;
  model: string;
  createdAt: string;
}

export interface ReviewListItem extends Review {
  projectName: string;
}

export interface SessionUser {
  name: string;
  email: string;
}

export type MessageRole = "USER" | "ASSISTANT";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Files the assistant used as context (assistant messages only). */
  sources?: string[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export type InsightKind = "ARCHITECTURE" | "README" | "SETUP" | "API_DOCS";

export interface Insight {
  kind: InsightKind;
  content: string;
  createdAt: string;
}

export interface AiProvider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  /** The key itself never reaches the browser. */
  hasApiKey: boolean;
  isDefault: boolean;
}
