import { SectionLabel } from "@/components/ui/section-label";
import type { Lens } from "@/content/landing";

interface LensesProps {
  lenses: Lens[];
}

export function Lenses({ lenses }: LensesProps) {
  return (
    <section
      id="lenses"
      aria-labelledby="lenses-title"
      className="border-t border-line px-4 py-24 sm:px-8 md:px-16"
    >
      <SectionLabel>Review lenses</SectionLabel>
      <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_7fr]">
        <h2
          id="lenses-title"
          className="text-3xl leading-tight font-semibold tracking-display text-paper sm:text-[40px]"
        >
          One codebase, three questions.{" "}
          <span className="text-silver-500">
            Each lens tells the model exactly what to look for, so reports stay
            focused instead of generic.
          </span>
        </h2>
        <ul className="border-t border-line">
          {lenses.map((lens) => (
            <li
              key={lens.name}
              className="grid gap-4 border-b border-line py-8 sm:grid-cols-[180px_1fr]"
            >
              <div>
                <h3 className="text-xl font-medium text-paper">{lens.name}</h3>
                <p className="mt-1 text-sm text-silver-500">{lens.tagline}</p>
              </div>
              <ul className="grid gap-x-6 gap-y-2 font-mono text-[13px] text-silver-300 sm:grid-cols-2">
                {lens.checks.map((check) => (
                  <li key={check} className="flex gap-2">
                    <span aria-hidden className="text-silver-500">
                      —
                    </span>
                    {check}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
