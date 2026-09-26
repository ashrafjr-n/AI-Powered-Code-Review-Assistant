import { SectionLabel } from "@/components/ui/section-label";
import type { Step } from "@/content/landing";

interface HowItWorksProps {
  steps: Step[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="border-t border-line px-4 py-24 sm:px-8 md:px-16"
    >
      <SectionLabel>How it works</SectionLabel>
      <h2
        id="how-it-works-title"
        className="mt-10 max-w-3xl text-3xl leading-tight font-semibold tracking-display text-paper sm:text-[40px]"
      >
        Three steps.{" "}
        <span className="text-silver-500">
          No plugins, no pipeline changes, no setup on your side.
        </span>
      </h2>
      <ol className="mt-14 grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
        {steps.map((step) => (
          <li
            key={step.number}
            className="border-b border-line py-8 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0"
          >
            <p className="font-mono text-xs text-silver-500">{step.number}</p>
            <h3 className="mt-6 text-xl font-medium text-paper">
              {step.title}
            </h3>
            <p className="mt-3 leading-relaxed text-silver-400">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
