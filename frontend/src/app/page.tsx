// TEMPORARY (F0): shows the design foundations for review. Replaced by the landing page in F1.
import { ArrowRight, Trash2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Panel } from "@/components/ui/panel";
import { SectionLabel } from "@/components/ui/section-label";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { SEVERITY_ORDER } from "@/lib/severity";

const swatches = [
  { name: "ink-950", className: "bg-ink-950" },
  { name: "ink-900", className: "bg-ink-900" },
  { name: "ink-850", className: "bg-ink-850" },
  { name: "ink-800", className: "bg-ink-800" },
  { name: "line", className: "bg-line" },
  { name: "line-strong", className: "bg-line-strong" },
  { name: "silver-500", className: "bg-silver-500" },
  { name: "silver-400", className: "bg-silver-400" },
  { name: "silver-300", className: "bg-silver-300" },
  { name: "silver-200", className: "bg-silver-200" },
  { name: "paper", className: "bg-paper" },
  { name: "red", className: "bg-red" },
];

export default function FoundationsPreview() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-16 px-4 py-16 sm:px-8">
      <section className="space-y-6">
        <SectionLabel>Logo</SectionLabel>
        <Logo className="h-16 w-auto" />
        <div className="flex items-center gap-6">
          <Logo className="h-7 w-auto" />
          <Logo markOnly className="size-8" />
          <Logo markOnly className="size-4" />
        </div>
      </section>

      <section className="space-y-6">
        <SectionLabel>Color</SectionLabel>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {swatches.map((swatch) => (
            <div key={swatch.name} className="space-y-2">
              <div
                className={`h-14 rounded-sm border border-line ${swatch.className}`}
              />
              <p className="font-mono text-[11px] text-silver-400">
                {swatch.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionLabel>Type</SectionLabel>
        <h1 className="text-[44px] leading-[1.05] font-semibold tracking-display text-paper sm:text-[88px]">
          Code review, on your terms.
        </h1>
        <p className="max-w-2xl text-xl text-silver-400">
          <span className="text-paper">Bring your own model.</span> Run reviews
          with OpenAI, or keep your code on your machine with LM Studio and
          Ollama.
        </p>
        <p className="font-mono text-[12px] tracking-label text-silver-500 uppercase">
          Mono label · 12px · JetBrains Mono
        </p>
        <code className="block rounded-sm border border-line bg-ink-800 p-4 font-mono text-sm text-silver-200">
          const apiKey = process.env.OPENAI_API_KEY;
        </code>
      </section>

      <section className="space-y-6">
        <SectionLabel>Buttons</SectionLabel>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            Start reviewing <ArrowRight className="size-4" strokeWidth={1.5} />
          </Button>
          <Button variant="secondary">See a sample report</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">
            <Trash2 className="size-4" strokeWidth={1.5} /> Delete project
          </Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-6">
        <SectionLabel>Severity · Panel · Kbd</SectionLabel>
        <Panel className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            {SEVERITY_ORDER.map((severity) => (
              <SeverityBadge key={severity} severity={severity} />
            ))}
          </div>
          <p className="text-sm text-silver-400">
            Press <Kbd>/</Kbd> to search, <Kbd>Esc</Kbd> to close.
          </p>
        </Panel>
      </section>
    </main>
  );
}
