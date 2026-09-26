import Link from "next/link";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { formatDateTime } from "@/lib/format";
import { MODE_LABEL, SCOPE_LABEL } from "@/lib/labels";
import {
  countBySeverity,
  reviewVerdict,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
} from "@/lib/severity";
import type { Review } from "@/lib/types";
import { workspaceHref } from "@/lib/workspace-url";
import { SeverityBar } from "./severity-bar";

interface ReviewReportProps {
  review: Review;
}

// The full report on the dark app surface. Issues link to the exact line in the workspace.
export function ReviewReport({ review }: ReviewReportProps) {
  const counts = countBySeverity(review.issues);
  const groups = SEVERITY_ORDER.map((severity) => ({
    severity,
    issues: review.issues.filter((issue) => issue.severity === severity),
  })).filter((group) => group.issues.length > 0);

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
        <SeverityBar issues={review.issues} />
        <p className="max-w-3xl text-lg leading-relaxed text-silver-300">
          {review.summary}
        </p>
      </header>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="issues-title" className="space-y-8">
          <h2
            id="issues-title"
            className="font-mono text-xs tracking-label text-silver-500 uppercase"
          >
            Issues ({review.issues.length})
          </h2>
          {groups.length === 0 && (
            <p className="text-silver-400">No issues found with this lens.</p>
          )}
          {groups.map((group) => (
            <div key={group.severity} className="space-y-3">
              <h3 className="sr-only">{SEVERITY_LABEL[group.severity]}</h3>
              <ol className="space-y-3">
                {group.issues.map((issue) => (
                  <li
                    key={`${issue.title}-${issue.filePath}`}
                    className="rounded-md border border-line bg-ink-900 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <SeverityBadge severity={issue.severity} />
                      {issue.filePath && (
                        <Link
                          href={workspaceHref(review.projectId, {
                            file: issue.filePath,
                            line: issue.line,
                          })}
                          className="font-mono text-xs text-silver-400 underline decoration-line-strong underline-offset-4 hover:text-paper"
                        >
                          {issue.filePath}
                          {issue.line ? `:${issue.line}` : ""}
                        </Link>
                      )}
                    </div>
                    <p className="mt-3 font-medium text-paper">{issue.title}</p>
                    <p className="mt-1 leading-relaxed text-silver-400">
                      {issue.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
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
