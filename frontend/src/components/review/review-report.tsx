import Link from "next/link";
import { FileCode2 } from "lucide-react";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { cn } from "@/lib/cn";
import { groupIssuesByFile } from "@/lib/issue-groups";
import { formatDateTime } from "@/lib/format";
import { MODE_LABEL, SCOPE_LABEL } from "@/lib/labels";
import {
  countBySeverity,
  reviewVerdict,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
} from "@/lib/severity";
import type { Review, Severity } from "@/lib/types";
import { workspaceHref } from "@/lib/workspace-url";
import { DiffView } from "./diff-view";
import { SeverityBar } from "./severity-bar";

interface ReviewReportProps {
  review: Review;
  /** From ?severity=…: show only this level. */
  only?: Severity;
}

// The full report on the dark app surface. Issues are grouped by file (worst first) and
// link to the exact line in the workspace. The severity filter lives in the URL.
export function ReviewReport({ review, only }: ReviewReportProps) {
  const counts = countBySeverity(review.issues);
  const groups = groupIssuesByFile(review.issues, only);
  const reportHref = `/projects/${review.projectId}/reviews/${review.id}`;
  const chips = [
    { label: "All", count: review.issues.length, severity: undefined },
    ...SEVERITY_ORDER.filter((severity) => counts[severity] > 0).map(
      (severity) => ({
        label: SEVERITY_LABEL[severity],
        count: counts[severity],
        severity,
      }),
    ),
  ];

  return (
    <article className="space-y-10">
      <header className="space-y-6 border-b border-line pb-8">
        <p className="font-mono text-xs tracking-label text-silver-500 uppercase">
          {MODE_LABEL[review.mode]} review · {SCOPE_LABEL[review.scope]} ·{" "}
          {formatDateTime(review.createdAt)}
        </p>
        <h1 className="relative inline-block text-3xl leading-tight font-semibold tracking-display text-paper">
          {reviewVerdict(review.issues)}
          {counts.CRITICAL > 0 && (
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 h-0.5 w-full origin-left animate-draw bg-red"
            />
          )}
        </h1>
        <SeverityBar issues={review.issues} variant="count" />
        <p className="max-w-3xl text-lg leading-relaxed text-silver-300">
          {review.summary}
        </p>
      </header>

      {review.diff && (
        <DiffView
          patch={review.diff}
          before={review.filePaths[0]}
          after={review.filePaths[1]}
        />
      )}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="issues-title" className="space-y-4">
          <h2
            id="issues-title"
            className="font-mono text-xs tracking-label text-silver-500 uppercase"
          >
            Issues ({review.issues.length})
          </h2>
          {review.issues.length > 0 && (
            <nav aria-label="Filter issues by severity">
              <ul className="flex flex-wrap gap-2">
                {chips.map((chip) => {
                  const active = chip.severity === only;
                  return (
                    <li key={chip.label}>
                      <Link
                        href={
                          chip.severity
                            ? `${reportHref}?severity=${chip.severity}`
                            : reportHref
                        }
                        scroll={false}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "inline-flex h-7 items-center gap-2 rounded-sm border px-2.5 font-mono text-xs transition-colors",
                          active
                            ? "border-silver-300 bg-ink-850 text-paper"
                            : "border-line text-silver-400 hover:border-line-strong hover:text-paper",
                        )}
                      >
                        {chip.label}
                        <span className="text-silver-500 tabular-nums">
                          {chip.count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          {review.issues.length === 0 && (
            <p className="text-silver-400">No issues found with this lens.</p>
          )}
          {groups.map((group) => (
            <section
              key={group.filePath ?? "general"}
              aria-label={group.filePath ?? "General"}
              className="overflow-hidden rounded-md border border-line bg-ink-900"
            >
              <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                {group.filePath ? (
                  <Link
                    href={workspaceHref(review.projectId, {
                      file: group.filePath,
                    })}
                    className="flex min-w-0 items-center gap-2 font-mono text-xs text-paper hover:underline hover:underline-offset-4"
                  >
                    <FileCode2
                      aria-hidden
                      className="size-3.5 shrink-0 text-silver-500"
                      strokeWidth={1.5}
                    />
                    <span className="truncate">{group.filePath}</span>
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-silver-400">
                    General
                  </span>
                )}
                <span className="shrink-0 font-mono text-xs text-silver-500">
                  {group.issues.length}{" "}
                  {group.issues.length === 1 ? "issue" : "issues"}
                </span>
              </header>
              <ol className="divide-y divide-line">
                {group.issues.map((issue) => (
                  <li
                    key={`${issue.title}-${issue.line}`}
                    className="space-y-2 px-5 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <SeverityBadge severity={issue.severity} />
                      {group.filePath && issue.line && (
                        <Link
                          href={workspaceHref(review.projectId, {
                            file: group.filePath,
                            line: issue.line,
                          })}
                          className="font-mono text-xs text-silver-400 underline decoration-line-strong underline-offset-4 hover:text-paper"
                        >
                          Line {issue.line}
                        </Link>
                      )}
                    </div>
                    <p className="font-medium text-paper">{issue.title}</p>
                    <p className="leading-relaxed text-silver-400">
                      {issue.description}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </section>

        <aside className="space-y-8">
          <section
            aria-labelledby="recommendations-title"
            className="space-y-4"
          >
            <h2
              id="recommendations-title"
              className="font-mono text-xs tracking-label text-silver-500 uppercase"
            >
              Recommendations
            </h2>
            {review.recommendations.length === 0 ? (
              <p className="text-sm text-silver-500">Nothing to add.</p>
            ) : (
              <ol className="space-y-3">
                {review.recommendations.map((recommendation, index) => (
                  <li
                    key={recommendation}
                    className="flex gap-3 text-sm leading-relaxed text-silver-300"
                  >
                    <span className="font-mono text-xs leading-6 text-silver-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {recommendation}
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section
            aria-labelledby="meta-title"
            className="space-y-3 border-t border-line pt-6"
          >
            <h2
              id="meta-title"
              className="font-mono text-xs tracking-label text-silver-500 uppercase"
            >
              Details
            </h2>
            <dl className="space-y-2 font-mono text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-silver-500">Model</dt>
                <dd className="text-right text-silver-300">
                  {review.providerName} · {review.model}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-silver-500">Files</dt>
                <dd className="text-silver-300">{review.filePaths.length}</dd>
              </div>
            </dl>
            <ul className="space-y-1 font-mono text-xs text-silver-500">
              {review.filePaths.map((path) => (
                <li key={path} className="truncate">
                  {path}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </article>
  );
}
