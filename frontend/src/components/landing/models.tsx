import { HardDrive } from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";
import type { Provider } from "@/content/landing";
import { cn } from "@/lib/cn";

interface ModelsProps {
  title: string;
  body: string;
  localNote: string;
  providers: Provider[];
}

export function Models({ title, body, localNote, providers }: ModelsProps) {
  return (
    <section
      id="models"
      aria-labelledby="models-title"
      className="border-t border-line px-4 py-24 sm:px-8 md:px-16"
    >
      <SectionLabel>Models</SectionLabel>
      <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_7fr]">
        <div>
          <h2
            id="models-title"
            className="text-3xl leading-tight font-semibold tracking-display text-paper sm:text-[40px]"
          >
            {title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-silver-400">{body}</p>
          <p className="mt-8 flex gap-3 border-l border-silver-500 pl-4 text-silver-300">
            <HardDrive
              aria-hidden
              className="mt-1 size-4 shrink-0 text-silver-400"
              strokeWidth={1.5}
            />
            {localNote}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-t border-line text-left">
            <caption className="sr-only">Supported providers</caption>
            <thead>
              <tr className="font-mono text-[11px] tracking-label text-silver-500 uppercase">
                <th scope="col" className="py-3 font-normal">
                  Provider
                </th>
                <th scope="col" className="py-3 font-normal">
                  Base URL
                </th>
                <th scope="col" className="py-3 text-right font-normal">
                  Runs
                </th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.name} className="border-t border-line">
                  <th scope="row" className="py-4 font-medium text-paper">
                    {provider.name}
                  </th>
                  <td className="py-4 font-mono text-[13px] text-silver-400">
                    {provider.baseUrl}
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className={cn(
                        "rounded-sm border px-1.5 py-0.5 font-mono text-[11px] tracking-label uppercase",
                        provider.location === "Local"
                          ? "border-silver-300 text-paper"
                          : "border-line text-silver-500",
                      )}
                    >
                      {provider.location}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
