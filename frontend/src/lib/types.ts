// Domain types. They mirror the backend Prisma enums/models (backend/prisma/schema.prisma).

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ReviewMode = "SECURITY" | "PERFORMANCE" | "QUALITY";

export type ReviewScope = "FILE" | "FILES" | "PROJECT";

export interface ReviewIssue {
  title: string;
  description: string;
  severity: Severity;
  filePath?: string;
  line?: number;
}

export interface Review {
  id: string;
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
