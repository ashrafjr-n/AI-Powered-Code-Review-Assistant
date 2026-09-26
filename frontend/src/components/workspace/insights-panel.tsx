import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { insightDocs } from "@/content/insights";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { workspaceHref } from "@/lib/workspace-url";
import type { Insight, InsightKind } from "@/lib/types";
import { InsightForm } from "./insight-form";

interface InsightsPanelProps {
  projectId: string;
  insights: Insight[];
  /** The project's current code version: older documents are marked outdated. */
  codeVersion: number;
  /** The document open in the middle pane, if any. */
  openDoc?: InsightKind;
  /** The selected file, kept in links so "Back to code" returns to it. */
  file?: string;
}

// The panel is narrow: it only lists the four documents with their state.
// A generated document opens in the wide middle pane (?doc=…), rendered as Markdown.
export function InsightsPanel({
  projectId,
  insights,
  codeVersion,
  openDoc,
  file,
}: InsightsPanelProps) {
  const byKind = new Map(insights.map((insight) => [insight.kind, insight]));
  return (
    <div className="space-y-4 p-4">
      <p className="text-xs leading-relaxed text-silver-500">
        Drafts written from the code. Open one to read it, copy it into your
        repository and edit.
      </p>
      <ul className="space-y-3">
        {insightDocs.map((doc) => {
          const insight = byKind.get(doc.kind);
          const open = openDoc === doc.kind;
          return (
            <li
              key={doc.kind}
              className={cn(
                "space-y-3 rounded-md border p-3",
                open ? "border-silver-300 bg-ink-850" : "border-line",
              )}
            >
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-medium text-paper">
                    {doc.title}
                  </h2>
                  {insight &&
                    (open ? (
                      <span className="shrink-0 font-mono text-xs text-silver-500">
                        Reading
                      </span>
                    ) : (
                      <Link
                        href={workspaceHref(projectId, {
                          tab: "insights",
                          doc: doc.kind,
                          file,
                        })}
                        className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs text-silver-300 transition-colors hover:text-paper"
                      >
                        Open
                        <ArrowRight
                          aria-hidden
                          className="size-3.5"
                          strokeWidth={1.5}
                        />
                      </Link>
                    ))}
                </div>
                <p className="text-xs leading-relaxed text-silver-500">
                  {doc.description}
                </p>
                <p className="font-mono text-[11px] text-silver-400">
                  {insight
                    ? `Generated ${formatDateTime(insight.createdAt)} · ${insight.model}`
                    : "Not generated yet"}
                  {insight && insight.codeVersion !== codeVersion && (
                    <span className="text-paper">
                      {" "}
                      · Outdated: code changed
                    </span>
                  )}
                </p>
              </div>
              <InsightForm
                projectId={projectId}
                label={insight ? "Regenerate" : "Generate"}
              >
                <input type="hidden" name="kind" value={doc.kind} />
                {file && <input type="hidden" name="file" value={file} />}
              </InsightForm>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
