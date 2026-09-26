import { Gift } from "lucide-react";
import { UsageBar } from "@/components/ui/usage-bar";
import { demoCard } from "@/content/demo";
import { formatTimeLeft } from "@/lib/format";

interface DemoCardProps {
  model: string;
  used: number;
  limit: number;
  resetsAt: string;
  siteLimitReached: boolean;
  /** true = the user has no own provider, so the demo is what runs. */
  inUse: boolean;
}

export function DemoCard({
  model,
  used,
  limit,
  resetsAt,
  siteLimitReached,
  inUse,
}: DemoCardProps) {
  const left = Math.max(0, limit - used);
  return (
    <section
      aria-labelledby="demo-title"
      className="space-y-4 rounded-md border border-line bg-ink-900 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2
            id="demo-title"
            className="flex items-center gap-2 font-medium text-paper"
          >
            <Gift aria-hidden className="size-4" strokeWidth={1.5} />
            {demoCard.title}
          </h2>
          <p className="font-mono text-xs text-silver-400">{model}</p>
        </div>
        <p className="font-mono text-xs text-silver-500">
          {inUse ? demoCard.inUse : demoCard.notInUse}
        </p>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-silver-400">
        {demoCard.body}
      </p>
      <div className="max-w-md space-y-2">
        <UsageBar
          used={used}
          limit={limit}
          label="Free demo requests used today"
        />
        <p className="flex flex-wrap justify-between gap-2 font-mono text-xs text-silver-500">
          <span>
            {siteLimitReached
              ? "Used up for today on the whole site"
              : `${left} of ${limit} left today`}
          </span>
          <span>Resets in {formatTimeLeft(resetsAt)} (00:00 UTC)</span>
        </p>
      </div>
      <p className="border-l border-silver-500 pl-3 text-xs leading-relaxed text-silver-500">
        {demoCard.privacy}
      </p>
    </section>
  );
}
