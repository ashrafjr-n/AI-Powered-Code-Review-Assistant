// Turns a saved unified diff (backend/src/reviews/review-diff.ts) into rows for the report.

export type DiffRow =
  | { kind: "hunk"; text: string }
  | {
      kind: "same" | "add" | "del";
      text: string;
      /** Line in the before file (not for added lines). */
      oldLine?: number;
      /** Line in the after file (not for removed lines). */
      newLine?: number;
    };

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parseDiff(patch: string): DiffRow[] {
  const rows: DiffRow[] = [];
  let oldLine = 0;
  let newLine = 0;
  for (const line of patch.split("\n")) {
    if (line.startsWith("--- ") || line.startsWith("+++ ")) continue;
    const hunk = HUNK.exec(line);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      rows.push({ kind: "hunk", text: line });
    } else if (line.startsWith("+")) {
      rows.push({ kind: "add", text: line.slice(1), newLine: newLine++ });
    } else if (line.startsWith("-")) {
      rows.push({ kind: "del", text: line.slice(1), oldLine: oldLine++ });
    } else if (rows.length > 0) {
      rows.push({
        kind: "same",
        text: line.slice(1),
        oldLine: oldLine++,
        newLine: newLine++,
      });
    }
  }
  return rows;
}
