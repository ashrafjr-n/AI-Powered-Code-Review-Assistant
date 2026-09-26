import { highlightCode } from "@/lib/highlight";
import { formatBytes } from "@/lib/format";
import { languageFor } from "@/lib/language";
import type { ProjectFile } from "@/lib/types";

interface CodeViewerProps {
  file: ProjectFile;
  highlightLine?: number;
}

export async function CodeViewer({ file, highlightLine }: CodeViewerProps) {
  const language = languageFor(file.path);
  const html = await highlightCode(file.content, language, highlightLine);
  const lineCount = file.content.split("\n").length;

  return (
    <section
      aria-label={`Code: ${file.path}`}
      className="flex min-h-0 flex-col"
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 font-mono text-xs">
        <span className="truncate text-paper">{file.path}</span>
        <span className="shrink-0 text-silver-500">
          {language} · {lineCount} lines · {formatBytes(file.size)}
        </span>
      </header>
      {/* Shiki escapes the file content, so rendering its HTML is safe from XSS. */}
      <div
        className="code-view min-h-0 flex-1 overflow-auto py-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
