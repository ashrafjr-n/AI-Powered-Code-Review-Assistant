// Simple keyword retrieval (the brief allows it; no embeddings, D17/D62):
// score every file by the question's words, keep the best few.

const TOP_FILES = 3;

// Words that appear in almost every question and say nothing about the code.
const STOP_WORDS = new Set(
  (
    'the and for how what where which does this that with from are why when who can you ' +
    'file files code project explain show work works use used into about there their ' +
    'have has should would could will our your all any its not but get set make'
  ).split(' '),
);

/** "Where are errors handled?" → ["error", "handled"]. */
export function keywords(question: string): string[] {
  const words = question.toLowerCase().match(/[a-z0-9_]{3,}/g) ?? [];
  const cleaned = words
    .filter((word) => !STOP_WORDS.has(word))
    // Crude plural → singular, so "errors" also finds "error".
    .map((word) =>
      word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word,
    );
  return [...new Set(cleaned)];
}

function count(text: string, word: string): number {
  return text.split(word).length - 1;
}

/**
 * A word in the path counts a lot (the file is probably *about* it); each hit in the
 * content counts once, capped so one huge file can't win on size alone.
 */
// ponytail: scans every file's content per question; use Postgres full-text search
// or embeddings if projects get large.
export function rankFiles(
  question: string,
  files: { path: string; content: string }[],
  limit = TOP_FILES,
): string[] {
  const words = keywords(question);
  if (words.length === 0) return [];
  return files
    .map((file) => {
      const path = file.path.toLowerCase();
      const content = file.content.toLowerCase();
      const score = words.reduce(
        (sum, word) =>
          sum +
          (path.includes(word) ? 10 : 0) +
          Math.min(count(content, word), 20),
        0,
      );
      return { path: file.path, score };
    })
    .filter((file) => file.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit)
    .map((file) => file.path);
}

/**
 * The files sent with a question, best first (at most TOP_FILES):
 * 1. the file open in the workspace, so "explain this file" works;
 * 2. keyword matches;
 * 3. only if no word matched: the files of the previous answer, so follow-ups like
 *    "and where is it called?" keep their context.
 * Only readable files of this project are returned.
 */
export function pickSources(input: {
  question: string;
  files: { path: string; content: string }[];
  openFile?: string;
  previous?: string[];
}): string[] {
  const readable = new Set(input.files.map((file) => file.path));
  const ranked = rankFiles(input.question, input.files);
  const fallback = ranked.length === 0 ? (input.previous ?? []) : [];
  return [...new Set([input.openFile, ...ranked, ...fallback])]
    .filter((path): path is string => !!path && readable.has(path))
    .slice(0, TOP_FILES);
}
