import { SectionLabel } from "@/components/ui/section-label";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { formatDate } from "@/lib/format";
import { MODE_LABEL, SCOPE_LABEL } from "@/lib/labels";
import {
  countBySeverity,
  reviewVerdict,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
} from "@/lib/severity";
import type { Review, Severity } from "@/lib/types";

// Bar segment tones on the light paper surface. Red only for CRITICAL.
const segmentClass: Record<Severity, string> = {
  CRITICAL: "bg-red",
  HIGH: "bg-ink-950",
  MEDIUM: "bg-ink-800/50",
  LOW: "bg-silver-300",
};

interface SampleReportProps {
  review: Review;
}

// The only light ("paper") surface on the landing page: a real-looking report.
export function SampleReport({ review }: SampleReportProps) {
  const counts = countBySeverity(review.issues);
  const segments = SEVERITY_ORDER.map((severity) => ({
    severity,
    count: counts[severity],
    percent: (counts[severity] / review.issues.length) * 100,
  })).filter((segment) => segment.count > 0);
  const hasCritical = counts.CRITICAL > 0;
  const meta = [
    `${review.providerName} · ${review.model}`,
    `${review.filePaths.length} files`,
    formatDate(review.createdAt),
  ];

  return (
    <section
      id="sample-report"
      aria-labelledby="sample-report-title"
      className="border-t border-line px-4 py-24 sm:px-8 md:px-16"
    >
      <SectionLabel>Sample report</SectionLabel>
      <h2
        id="sample-report-title"
        className="mt-10 max-w-3xl text-3xl leading-tight font-semibold tracking-display text-paper sm:text-[40px]"
      >
        What you get back.{" "}
        <span className="text-silver-500">
          A report you can act on, not a wall of chat text.
        </span>
      </h2>

      <article className="mt-14 rounded-md bg-paper text-ink-800 shadow-[0_24px_80px_-24px_rgb(0_0_0/0.8)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-950/10 px-6 py-4 font-mono text-xs text-silver-500 sm:px-10">
          <span className="tracking-label uppercase">
            {MODE_LABEL[review.mode]} review · {SCOPE_LABEL[review.scope]}
          </span>
          <span>{meta.join("  ·  ")}</span>
        </header>

        <div className="px-6 py-10 sm:px-10">
          <p className="relative inline-block text-2xl font-semibold tracking-display text-ink-950 sm:text-3xl">
            {reviewVerdict(review.issues)}
            {hasCritical && (
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-0.5 w-full origin-left animate-draw bg-red"
              />
            )}
          </p>

          <div className="mt-8">
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-sm">
              {segments.map((segment) => (
                <span
                  key={segment.severity}
                  className={segmentClass[segment.severity]}
                  style={{ width: `${segment.percent}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-silver-500">
              {SEVERITY_ORDER.map((severity) => (
                <li key={severity}>
                  <span className="text-ink-950 tabular-nums">
                    {counts[severity]}
                  </span>{" "}
                  {SEVERITY_LABEL[severity]}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-10 max-w-3xl text-lg leading-relaxed">
            {review.summary}
          </p>
        </div>

        <div className="grid border-t border-ink-950/10 lg:grid-cols-[7fr_5fr]">
          <div className="px-6 py-8 sm:px-10">
            <h3 className="font-mono text-xs tracking-label text-silver-500 uppercase">
              Issues
            </h3>
            <ol className="mt-4">
              {review.issues.map((issue) => (
                <li
                  key={issue.title}
                  className="border-t border-ink-950/10 py-5 first:border-t-0"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <SeverityBadge severity={issue.severity} surface="paper" />
                    <span className="font-mono text-xs text-silver-500">
                      {issue.filePath}:{issue.line}
                    </span>
                  </div>
                  <p className="mt-3 font-medium text-ink-950">{issue.title}</p>
                  <p className="mt-1 leading-relaxed">{issue.description}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="border-t border-ink-950/10 px-6 py-8 sm:px-10 lg:border-t-0 lg:border-l">
            <h3 className="font-mono text-xs tracking-label text-silver-500 uppercase">
              Recommendations
            </h3>
            <ol className="mt-4 space-y-4">
              {review.recommendations.map((recommendation, index) => (
                <li key={recommendation} className="flex gap-4 leading-relaxed">
                  <span className="font-mono text-xs leading-7 text-silver-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {recommendation}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </article>
    </section>
  );
}
