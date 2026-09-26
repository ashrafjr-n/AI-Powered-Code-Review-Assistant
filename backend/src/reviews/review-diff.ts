import { structuredPatch } from 'diff';
import type { SourceFile } from './review-prompt.js';

// Diff Review (bonus): compare two files and review only what changed.

const CONTEXT_LINES = 3;

export interface FileDiff {
  /** Standard unified diff: saved on the review and shown in the report. */
  patch: string;
  /** The same changes with the after file's line numbers, for the model. */
  numbered: string;
}

/** null when the files are identical. */
export function diffFiles(
  before: SourceFile,
  after: SourceFile,
): FileDiff | null {
  const { hunks } = structuredPatch(
    before.path,
    after.path,
    before.content,
    after.content,
    '',
    '',
    { context: CONTEXT_LINES },
  );
  if (hunks.length === 0) return null;

  const patch = [`--- ${before.path}`, `+++ ${after.path}`];
  const numbered: string[] = [];
  for (const hunk of hunks) {
    patch.push(
      `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
    );
    numbered.push('…');
    let line = hunk.newStart;
    for (const text of hunk.lines) {
      // "\ No newline at end of file" is a note, not a line of code.
      if (text.startsWith('\\')) continue;
      patch.push(text);
      // Removed lines don't exist in the after file, so they get no number.
      numbered.push(
        text.startsWith('-')
          ? `    | ${text}`
          : `${String(line++).padStart(4)}| ${text}`,
      );
    }
  }
  return { patch: patch.join('\n'), numbered: numbered.join('\n') };
}
