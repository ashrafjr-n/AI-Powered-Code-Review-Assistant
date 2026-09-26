import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { insightTitle } from "@/content/insights";
import { formatDateTime } from "@/lib/format";
import type { Insight } from "@/lib/types";

interface InsightDocumentProps {
  insight: Insight;
  /** Back to the code viewer. */
  closeHref: string;
}

// A generated document in the wide middle pane. Model output is untrusted: react-markdown
// builds React elements (no raw HTML, unsafe link protocols removed), so nothing runs.
// remark-gfm adds GitHub syntax: tables (API docs), strikethrough, task lists, autolinks.
export function InsightDocument({ insight, closeHref }: InsightDocumentProps) {
  const title = insightTitle[insight.kind];
  return (
    <section aria-label={title} className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line py-1 pr-1 pl-4 font-mono text-xs">
        <span className="min-w-0 truncate">
          <span className="text-paper">{title}</span>
          <span className="text-silver-500">
            {" "}
            · {insight.model} · {formatDateTime(insight.createdAt)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <CopyButton text={insight.content} />
          <Link
            href={closeHref}
            aria-label="Close document, back to code"
            className="flex size-8 items-center justify-center rounded-sm text-silver-400 transition-colors hover:bg-ink-850 hover:text-paper"
          >
            <X aria-hidden className="size-4" strokeWidth={1.5} />
          </Link>
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-6 py-6 sm:px-10">
        <article className="doc-view max-w-3xl">
          <Markdown remarkPlugins={[remarkGfm]}>{insight.content}</Markdown>
        </article>
      </div>
    </section>
  );
}
