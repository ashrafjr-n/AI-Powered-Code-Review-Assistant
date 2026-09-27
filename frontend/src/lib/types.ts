// Domain types. They mirror the backend Prisma enums/models (backend/prisma/schema.prisma).

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ReviewMode = "SECURITY" | "PERFORMANCE" | "QUALITY";

export type ReviewScope = "FILE" | "FILES" | "PROJECT" | "DIFF";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  fileCount: number;
  /** +1 on every upload; reviews/docs with a lower version describe older code. */
  codeVersion: number;
  /** null before the first upload. */
  uploadStats: UploadStats | null;
  /** Latest review: highest severity (null = clean) + issues per severity; undefined = never reviewed. */
  lastReview?: {
    severity: Severity | null;
    createdAt: string;
    counts: Record<Severity, number>;
    /** The code was uploaded again after this review. */
    outdated: boolean;
  };
}

/** A file in the tree: the list endpoint never sends content. */
export interface FileEntry {
  path: string;
  size: number;
  /** Env/key/credential file: listed, never opened or sent to a model. */
  sensitive: boolean;
}

/** What an upload left out, by reason. */
export interface SkipCounts {
  /** Dependencies, build output, caches, lock files, generated files. */
  ignored: number;
  binary: number;
  tooLarge: number;
}

export interface UploadStats {
  kept: number;
  sensitive: number;
  skipped: SkipCounts;
  /** Secrets inside code replaced with ‹redacted›. */
  redacted: number;
}

/** Before a whole-project review: how many readable files fit the budget. */
export interface ReviewPlan {
  total: number;
  fits: number;
  hidden: number;
}

export interface ProjectFile extends FileEntry {
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
  /** DIFF: [before, after]. */
  filePaths: string[];
  /** DIFF only: the unified diff that was reviewed (kept after re-uploads). */
  diff: string | null;
  /** The project's code version when the files were read. */
  codeVersion: number;
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

/** One page of history, newest first. `total` = all matches (for the pager). */
export interface ReviewPage {
  items: ReviewListItem[];
  total: number;
}

export interface SessionUser {
  id: string;
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

/** A conversation in the list (titles only). */
export interface ChatSessionSummary {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
}

/** The open conversation, with its messages (oldest first). */
export interface ChatSession extends ChatSessionSummary {
  messages: ChatMessage[];
}

export type InsightKind = "ARCHITECTURE" | "README" | "SETUP" | "API_DOCS";

export interface Insight {
  kind: InsightKind;
  content: string;
  /** The files the model read (big projects don't fit completely). */
  filePaths: string[];
  /** The project's code version when the files were read. */
  codeVersion: number;
  /** Snapshot of the model that wrote it (like reviews). */
  providerName: string;
  model: string;
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

export interface ProviderInput {
  name: string;
  baseUrl: string;
  model: string;
  /** Empty = keep the stored key (on edit) or no key (local servers). */
  apiKey: string;
  /** Edit only: forget the stored key. */
  removeApiKey?: boolean;
}

/** Result of "Test connection" (GET {baseUrl}/models on the backend). */
export interface ConnectionResult {
  ok: boolean;
  message: string;
  models: string[];
}

/** The built-in demo model (server key, daily limit). */
export type DemoStatus =
  | { enabled: false }
  | {
      enabled: true;
      name: string;
      model: string;
      used: number;
      limit: number;
      /** ISO time of the next reset (00:00 UTC). */
      resetsAt: string;
      siteLimitReached: boolean;
    };

/** Why a request to the demo model was refused (shown as a help panel, not an error). */
export interface DemoNotice {
  kind: "user" | "site" | "busy";
  /** ISO time of the reset (limits only). */
  resetsAt?: string;
}
