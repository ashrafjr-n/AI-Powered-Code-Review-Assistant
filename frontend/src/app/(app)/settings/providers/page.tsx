import type { Metadata } from "next";
import { Cpu, HardDrive } from "lucide-react";
import { ProviderActions } from "@/components/settings/provider-actions";
import { ProviderFormDialog } from "@/components/settings/provider-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { providerLocation } from "@/lib/providers";
import { listProviders } from "@/mocks/providers";

export const metadata: Metadata = { title: "Model providers" };

export default async function ProvidersPage() {
  const providers = await listProviders();

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="Model providers"
        description="Choose which model reviews your code. Any OpenAI-compatible API works."
        actions={providers.length > 0 ? <ProviderFormDialog /> : undefined}
      />

      {providers.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No model yet"
          body="Add OpenAI with an API key, or point Redline at LM Studio or Ollama running on your machine."
          action={<ProviderFormDialog />}
        />
      ) : (
        <ul className="space-y-3">
          {providers.map((provider) => (
            <li
              key={provider.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-ink-900 p-5"
            >
              <div className="min-w-0 space-y-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-paper">
                    {provider.name}
                  </span>
                  {provider.isDefault && (
                    <span className="rounded-sm border border-silver-300 px-1.5 py-0.5 font-mono text-[11px] tracking-label text-paper uppercase">
                      In use
                    </span>
                  )}
                  <span className="rounded-sm border border-line px-1.5 py-0.5 font-mono text-[11px] tracking-label text-silver-500 uppercase">
                    {providerLocation(provider.baseUrl)}
                  </span>
                </p>
                <p className="truncate font-mono text-xs text-silver-400">
                  {provider.baseUrl} · {provider.model}
                </p>
                <p className="font-mono text-xs text-silver-500">
                  {provider.hasApiKey
                    ? "API key stored, encrypted"
                    : "No API key"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <ProviderFormDialog provider={provider} />
                <ProviderActions
                  id={provider.id}
                  name={provider.name}
                  isDefault={provider.isDefault}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="flex gap-3 border-l border-silver-500 pl-4 text-sm leading-relaxed text-silver-400">
        <HardDrive
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={1.5}
        />
        Local providers (LM Studio, Ollama) work when you run Redline on your
        own machine. A hosted server can&apos;t reach your localhost.
      </p>
    </div>
  );
}
