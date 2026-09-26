import { CopyButton } from "@/components/ui/copy-button";
import { formatDateTime } from "@/lib/format";
import type { Insight, InsightKind } from "@/lib/types";
import { InsightForm } from "./insight-form";

const DOC_KINDS: { kind: InsightKind; label: string }[] = [
  { kind: "README", label: "README" },
  { kind: "SETUP", label: "Setup guide" },
  { kind: "API_DOCS", label: "API documentation" },
];

const TITLES: Record<InsightKind, string> = {
  ARCHITECTURE: "Architecture overview",
  README: "README",
  SETUP: "Setup guide",
  API_DOCS: "API documentation",
};

interface InsightsPanelProps {
  projectId: string;
  insights: Insight[];
}

export function InsightsPanel({ projectId, insights }: InsightsPanelProps) {
  const architecture = insights.find(
    (insight) => insight.kind === "ARCHITECTURE",
  );
  const docs = insights.filter((insight) => insight.kind !== "ARCHITECTURE");

  return (
    <div className="space-y-8 p-4">
      <section aria-labelledby="architecture-title" className="space-y-3">
        <h2 id="architecture-title" className="text-sm font-medium text-paper">
          Architecture overview
        </h2>
        <p className="text-xs leading-relaxed text-silver-500">
          A map of the layers, entry points and how the parts talk to each
          other.
        </p>
        <InsightForm
          projectId={projectId}
          label={architecture ? "Regenerate" : "Generate"}
        >
          <input type="hidden" name="kind" value="ARCHITECTURE" />
        </InsightForm>
        {architecture && <InsightOutput insight={architecture} />}
      </section>

      <section
        aria-labelledby="docs-title"
        className="space-y-3 border-t border-line pt-8"
      >
        <h2 id="docs-title" className="text-sm font-medium text-paper">
          Documentation
        </h2>
        <p className="text-xs leading-relaxed text-silver-500">
          Draft docs from the code. Copy them into your repository and edit.
        </p>
        <InsightForm projectId={projectId} label="Generate">
          <label htmlFor="doc-kind" className="sr-only">
            Document type
          </label>
          <select
            id="doc-kind"
            name="kind"
            className="h-8 min-w-0 flex-1 rounded-sm border border-line-strong bg-ink-800 px-2 text-sm text-paper"
          >
            {DOC_KINDS.map((doc) => (
              <option key={doc.kind} value={doc.kind}>
                {doc.label}
              </option>
            ))}
          </select>
        </InsightForm>
        {docs.map((insight) => (
          <InsightOutput key={insight.kind} insight={insight} />
        ))}
      </section>
    </div>
  );
}

function InsightOutput({ insight }: { insight: Insight }) {
  return (
    <article className="rounded-md border border-line bg-ink-950">
      <header className="flex items-center justify-between gap-2 border-b border-line py-1 pr-1 pl-3">
        <span className="font-mono text-xs text-silver-500">
          {TITLES[insight.kind]} · {formatDateTime(insight.createdAt)}
        </span>
        <CopyButton text={insight.content} />
      </header>
      <pre className="max-h-80 overflow-auto p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-silver-300">
        {insight.content}
      </pre>
    </article>
  );
}
