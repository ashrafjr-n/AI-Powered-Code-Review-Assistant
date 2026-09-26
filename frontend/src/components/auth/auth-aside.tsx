import { SeverityBadge } from "@/components/ui/severity-badge";
import type { ReviewIssue } from "@/lib/types";

interface AuthAsideProps {
  label: string;
  quote: string;
  issues: ReviewIssue[];
}

// Right side of the auth pages: a quiet piece of a real report instead of a stock image.
export function AuthAside({ label, quote, issues }: AuthAsideProps) {
  return (
    <aside className="relative hidden overflow-hidden border-l border-line bg-ink-900 lg:flex lg:flex-col lg:justify-center lg:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] bg-size-[100%_40px] opacity-40"
      />
      <div className="relative max-w-md">
        <p className="font-mono text-xs tracking-label text-silver-500 uppercase">
          {label}
        </p>
        <ul className="mt-8 space-y-4">
          {issues.map((issue) => (
            <li
              key={issue.title}
              className="rounded-md border border-line bg-ink-950 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <SeverityBadge severity={issue.severity} />
                <span className="truncate font-mono text-xs text-silver-500">
                  {issue.filePath}:{issue.line}
                </span>
              </div>
              <p className="mt-3 text-sm text-paper">{issue.title}</p>
            </li>
          ))}
        </ul>
        <blockquote className="mt-10 border-l border-silver-500 pl-4 text-lg leading-relaxed text-silver-300">
          {quote}
        </blockquote>
      </div>
    </aside>
  );
}
