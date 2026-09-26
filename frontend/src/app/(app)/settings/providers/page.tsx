import type { Metadata } from "next";
import { Cpu, HardDrive } from "lucide-react";
import { AddProviderButton } from "@/components/settings/add-provider-button";
import { DemoCard } from "@/components/settings/demo-card";
import { ProviderCard } from "@/components/settings/provider-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  getDemoStatus,
  getProviderOptions,
  listProviders,
} from "@/lib/api/providers";
import { emptyProvidersBody, localModelsNote } from "@/content/providers";

export const metadata: Metadata = { title: "Model providers" };

export default async function ProvidersPage() {
  const [providers, demo, options] = await Promise.all([
    listProviders(),
    getDemoStatus(),
    getProviderOptions(),
  ]);
  // The main model first, so it's found at a glance; the rest keep their saved order.
  const sorted = [...providers].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );
  const demoCard = demo.enabled && (
    <DemoCard
      model={demo.model}
      used={demo.used}
      limit={demo.limit}
      resetsAt={demo.resetsAt}
      siteLimitReached={demo.siteLimitReached}
      inUse={providers.length === 0}
    />
  );

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="Model providers"
        description="Choose which model reviews your code. Any OpenAI-compatible API works."
        actions={
          providers.length > 0 ? (
            <AddProviderButton localModels={options.localModels} />
          ) : undefined
        }
      />

      {providers.length === 0 ? (
        <>
          {demoCard}
          <EmptyState
            icon={Cpu}
            title="No model of your own yet"
            body={emptyProvidersBody}
            action={<AddProviderButton localModels={options.localModels} />}
          />
        </>
      ) : (
        <>
          <section aria-labelledby="own-models" className="space-y-3">
            <h2
              id="own-models"
              className="font-mono text-[11px] tracking-label text-silver-500 uppercase"
            >
              Your models · click one to make it main
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {sorted.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  localModels={options.localModels}
                />
              ))}
            </ul>
          </section>
          {demoCard}
        </>
      )}

      <p className="flex gap-3 border-l border-silver-500 pl-4 text-sm leading-relaxed text-silver-400">
        <HardDrive
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={1.5}
        />
        {options.localModels
          ? localModelsNote.selfHosted
          : localModelsNote.hosted}
      </p>
    </div>
  );
}
