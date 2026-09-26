import { z } from 'zod';
import type { Severity } from '../generated/prisma/client.js';

// The model's answer is untrusted input: parse it, validate it with Zod, and only keep
// file paths and line numbers that really exist in the reviewed files.

const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const cut = (max: number) => (text: string) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

// Small models write "high", "High " or 12 instead of "12": accept those, drop the rest.
const severitySchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
  z.enum(SEVERITY_ORDER),
);
const lineSchema = z
  .preprocess(
    (value) => (value === null || value === '' ? undefined : Number(value)),
    z.number().int().positive().optional(),
  )
  .catch(undefined);

const issueSchema = z.object({
  title: z.string().trim().min(1).transform(cut(200)),
  description: z.string().trim().default('').transform(cut(2000)),
  severity: severitySchema,
  filePath: z.string().trim().nullish().catch(undefined),
  line: lineSchema,
});

const reviewOutputSchema = z.object({
  summary: z.string().trim().min(1).transform(cut(2000)),
  issues: z.array(issueSchema).max(100).default([]),
  recommendations: z
    .array(z.string().trim().min(1).transform(cut(500)))
    .max(20)
    .default([]),
});

export interface ReviewIssue {
  title: string;
  description: string;
  severity: Severity;
  filePath?: string;
  line?: number;
}

export interface ReviewOutput {
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
}

/** Models often wrap JSON in ```json fences or add a sentence around it. */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object found.');
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * Matches the model's path to a reviewed file: exact, without "./" or "/",
 * or a unique ending ("app.ts" → "src/app.ts"). Unknown paths are dropped.
 */
function matchPath(
  raw: string,
  lineCounts: Map<string, number>,
): string | undefined {
  const path = raw.replace(/^\.?\//, '');
  if (lineCounts.has(path)) return path;
  const endings = [...lineCounts.keys()].filter((known) =>
    known.endsWith(`/${path}`),
  );
  return endings.length === 1 ? endings[0] : undefined;
}

/** Parse + validate + clean. Throws with a short reason (sent back to the model on retry). */
export function parseReviewOutput(
  text: string,
  files: { path: string; content: string }[],
): ReviewOutput {
  const result = reviewOutputSchema.safeParse(extractJson(text));
  if (!result.success)
    throw new Error(z.prettifyError(result.error).slice(0, 500));

  const lineCounts = new Map(
    files.map((file) => [file.path, file.content.split('\n').length]),
  );
  const issues = result.data.issues.map(
    ({ filePath, line, ...issue }): ReviewIssue => {
      const path = filePath ? matchPath(filePath, lineCounts) : undefined;
      const validLine =
        path && line && line <= lineCounts.get(path)! ? line : undefined;
      return {
        ...issue,
        ...(path && { filePath: path }),
        ...(validLine && { line: validLine }),
      };
    },
  );
  issues.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  return { ...result.data, issues };
}

export function highestSeverity(issues: ReviewIssue[]): Severity | null {
  return (
    SEVERITY_ORDER.find((level) => issues.some((i) => i.severity === level)) ??
    null
  );
}
