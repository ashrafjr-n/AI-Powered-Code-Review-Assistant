import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import type { CodeLine } from "@/content/landing";
import { HeroEditor } from "./hero-editor";

interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  providerNames: string[];
  editor: {
    fileName: string;
    lines: CodeLine[];
    note: { title: string; body: string };
  };
}

// Ruled lines every 40px, like proof paper. Line numbers sit in the left gutter.
const GUTTER_LINES = Array.from({ length: 16 }, (_, index) => index + 1);

export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  providerNames,
  editor,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] bg-size-[100%_40px] opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <ol
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 hidden w-10 font-mono text-[11px] leading-10 text-silver-500/50 select-none md:block [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      >
        {GUTTER_LINES.map((number) => (
          <li key={number} className="pr-2 text-right">
            {number}
          </li>
        ))}
      </ol>

      <div className="relative px-4 pt-20 pb-16 text-center sm:px-8 sm:pt-28 md:px-16">
        <p className="animate-rise font-mono text-xs tracking-label text-silver-500 uppercase">
          {eyebrow}
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl animate-rise text-[44px] leading-[1.02] font-semibold tracking-display text-balance text-paper [animation-delay:80ms] sm:text-7xl lg:text-[88px]">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-rise text-lg leading-relaxed text-pretty text-silver-400 [animation-delay:160ms]">
          {subtitle}
        </p>
        <div className="mt-10 flex animate-rise flex-wrap justify-center gap-3 [animation-delay:240ms]">
          <Link href={primaryCta.href} className={buttonClass("primary")}>
            {primaryCta.label}
            <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
          </Link>
          <a href={secondaryCta.href} className={buttonClass("secondary")}>
            {secondaryCta.label}
          </a>
        </div>
        <p className="mt-8 font-mono text-xs text-silver-500">
          Works with {providerNames.join(" · ")}
        </p>

        <div className="mx-auto mt-16 max-w-5xl">
          <HeroEditor {...editor} />
        </div>
      </div>
    </section>
  );
}
