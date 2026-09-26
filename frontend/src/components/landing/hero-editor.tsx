import { SeverityBadge } from "@/components/ui/severity-badge";
import type { CodeLine, CodeTone } from "@/content/landing";

const toneClass: Record<CodeTone, string> = {
  plain: "text-silver-200",
  keyword: "text-paper font-medium",
  string: "text-silver-400",
  muted: "text-silver-500",
};

interface HeroEditorProps {
  fileName: string;
  lines: CodeLine[];
  note: { title: string; body: string };
}

// The product in one picture: a code file, one line struck by the red pen, and the margin note.
export function HeroEditor({ fileName, lines, note }: HeroEditorProps) {
  const flaggedLineNumber = lines.findIndex((line) => line.flagged) + 1;

  return (
    <figure className="grid overflow-hidden rounded-md border border-line bg-ink-900 text-left lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <figcaption className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-silver-400">
          <span>{fileName}</span>
          <span className="tracking-label text-silver-500 uppercase">
            Security lens
          </span>
        </figcaption>
        <pre className="overflow-x-auto py-4 font-mono text-[13px] leading-7">
          <code>
            {lines.map((line, index) => (
              <span
                key={index}
                className={
                  line.flagged ? "relative flex bg-ink-850" : "relative flex"
                }
              >
                <span
                  aria-hidden
                  className="w-12 shrink-0 pr-4 text-right text-silver-500 select-none"
                >
                  {index + 1}
                </span>
                <span className="relative pr-6">
                  {line.tokens.map((token, tokenIndex) => (
                    <span key={tokenIndex} className={toneClass[token.tone]}>
                      {token.text}
                    </span>
                  ))}
                  {line.flagged && (
                    <span
                      aria-hidden
                      className="absolute top-1/2 right-4 left-1 h-0.5 origin-left -rotate-1 animate-draw bg-red"
                    />
                  )}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
      <aside className="space-y-3 border-t border-line p-5 lg:border-t-0 lg:border-l">
        <SeverityBadge severity="CRITICAL" />
        <p className="font-medium text-paper">{note.title}</p>
        <p className="text-sm leading-relaxed text-silver-400">{note.body}</p>
        <p className="font-mono text-xs text-silver-500">
          {fileName}:{flaggedLineNumber}
        </p>
      </aside>
    </figure>
  );
}
