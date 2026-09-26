import { cn } from "@/lib/cn";
import { parseDiff, type DiffRow } from "@/lib/diff-lines";
import type { LineMarker } from "@/lib/issue-markers";
import type { Severity } from "@/lib/types";

interface DiffViewProps {
  patch: string;
  before: string;
  after: string;
  /** Issues of this review on the after file, by line (dots + link targets). */
  markers: Map<number, LineMarker>;
}

// Red budget: no red/green here. Added lines are bright on a raised row, removed
// lines are muted; the +/− sign and the words for screen readers carry the meaning.
const rowClass: Record<DiffRow["kind"], string> = {
  hunk: "bg-ink-950 text-silver-500",
  same: "text-silver-400",
  add: "bg-ink-800 text-paper",
  del: "bg-ink-850 text-silver-500",
};
const sign = { hunk: "", same: " ", add: "+", del: "−" };
const spoken = { hunk: "", same: "", add: "added", del: "removed" };
// Same dot colours as the code viewer: red only for critical (red budget).
const dotClass: Record<Severity, string> = {
  CRITICAL: "bg-red",
  HIGH: "bg-paper",
  MEDIUM: "bg-silver-400",
  LOW: "bg-silver-500",
};

/** Diff Review: the change that was reviewed, as saved with the review. */
export function DiffView({ patch, before, after, markers }: DiffViewProps) {
  const rows = parseDiff(patch);
  const added = rows.filter((row) => row.kind === "add").length;
  const removed = rows.filter((row) => row.kind === "del").length;

  return (
    <details
      open
      className="details-smooth overflow-hidden rounded-md border border-line bg-ink-900"
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 font-mono text-xs [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate text-paper">
          {before} <span className="text-silver-500">→</span> {after}
        </span>
        <span className="text-silver-500 tabular-nums">
          +{added} −{removed}
        </span>
      </summary>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full border-collapse font-mono text-xs leading-5">
          <caption className="sr-only">
            Changes from {before} to {after}
          </caption>
          <tbody>
            {/* Rows never reorder, so the index is a stable key. */}
            {rows.map((row, index) => (
              <tr
                key={index}
                // "Line 5 in the change" links land here (#diff-L5).
                id={
                  row.kind !== "hunk" && row.newLine
                    ? `diff-L${row.newLine}`
                    : undefined
                }
                className={cn(
                  rowClass[row.kind],
                  "scroll-mt-4 target:bg-ink-850 target:shadow-[inset_2px_0_0_var(--color-silver-200)]",
                )}
              >
                {row.kind === "hunk" ? (
                  <td colSpan={3} className="px-3 py-1">
                    {row.text}
                  </td>
                ) : (
                  <>
                    <td className="w-10 px-2 text-right text-silver-500 tabular-nums select-none">
                      {row.oldLine}
                    </td>
                    <td className="w-14 px-2 text-right text-silver-500 tabular-nums select-none">
                      {row.newLine && markers.has(row.newLine) && (
                        // Visual only: the issue list below says the same in words.
                        <span
                          aria-hidden
                          title={markers.get(row.newLine)!.titles.join("\n")}
                          className={cn(
                            "mr-1.5 inline-block size-1.5 rounded-full align-middle",
                            dotClass[markers.get(row.newLine)!.severity],
                          )}
                        />
                      )}
                      {row.newLine}
                    </td>
                    <td className="px-3 whitespace-pre">
                      <span aria-hidden className="select-none">
                        {sign[row.kind]}{" "}
                      </span>
                      {spoken[row.kind] && (
                        <span className="sr-only">{spoken[row.kind]}: </span>
                      )}
                      {row.text}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
