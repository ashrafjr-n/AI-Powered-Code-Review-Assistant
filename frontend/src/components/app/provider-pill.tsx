import Link from "next/link";
import { cn } from "@/lib/cn";
import { providerLocation } from "@/lib/providers";
import type { AiProvider } from "@/lib/types";

interface ProviderPillProps {
  provider: AiProvider | null;
}

// Always visible: which model reviews your code, and whether it runs locally.
export function ProviderPill({ provider }: ProviderPillProps) {
  return (
    <Link
      href="/settings/providers"
      className="group flex h-8 min-w-0 items-center gap-2 rounded-sm border border-line px-2.5 font-mono text-xs transition-colors hover:border-line-strong"
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          provider ? "bg-silver-200" : "border border-silver-500",
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
      ) : (
        <span className="text-silver-400 group-hover:text-paper">
          Set up a model
        </span>
      )}
    </Link>
  );
}
