import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { UsageBar } from "@/components/ui/usage-bar";
import { cn } from "@/lib/cn";
import { formatTimeLeft } from "@/lib/format";
import { providerLocation } from "@/lib/providers";
import type { AiProvider, DemoStatus } from "@/lib/types";

interface ProviderPillProps {
  provider: AiProvider | null;
  demo: DemoStatus;
}

// Always visible: which model reviews your code. Without an own provider, the demo
// model with a small bar for today's allowance and the time until it resets.
export function ProviderPill({ provider, demo }: ProviderPillProps) {
  const usingDemo = !provider && demo.enabled;
  const usedUp =
    usingDemo && (demo.used >= demo.limit || demo.siteLimitReached);
  const timeLeft = usingDemo ? formatTimeLeft(demo.resetsAt) : "";

  return (
    <Link
      href="/settings/providers"
      title={
        usingDemo
          ? `Free demo: ${demo.used} of ${demo.limit} requests used today. Resets in ${timeLeft} (00:00 UTC).`
          : undefined
      }
      className="group flex h-8 min-w-0 items-center gap-2 rounded-sm border border-line px-2.5 font-mono text-xs transition-colors hover:border-line-strong"
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          provider || (usingDemo && !usedUp)
            ? "bg-silver-200"
            : "border border-silver-500",
        )}
      />
      {provider ? (
        <>
          <span className="text-paper">{provider.name}</span>
          <span className="hidden truncate text-silver-400 sm:inline">
            {provider.model}
          </span>
          <span className="border-l border-line pl-2 text-[11px] tracking-label text-silver-500 uppercase">
            {providerLocation(provider.baseUrl)}
          </span>
        </>
      ) : usingDemo ? (
        <>
          <span className="text-paper">Demo</span>
          <span className="hidden truncate text-silver-400 md:inline">
            {demo.model}
          </span>
          <UsageBar
            used={demo.used}
            limit={demo.limit}
            label="Free demo requests used today"
            className="w-12 sm:w-16"
          />
          <span className="flex items-center gap-1 border-l border-line pl-2 text-[11px] text-silver-500">
            <RotateCcw aria-hidden className="size-3" strokeWidth={1.5} />
            <span className="sr-only">Resets in</span>
            {timeLeft}
          </span>
        </>
      ) : (
        <span className="text-silver-400 group-hover:text-paper">
          Set up a model
        </span>
      )}
    </Link>
  );
}
