import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

interface FinalCtaProps {
  title: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export function FinalCta({
  title,
  body,
  primaryCta,
  secondaryCta,
}: FinalCtaProps) {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="border-t border-line px-4 py-28 sm:px-8 md:px-16"
    >
      <div className="grid items-end gap-10 lg:grid-cols-[7fr_5fr]">
        <h2
          id="final-cta-title"
          className="text-4xl leading-[1.05] font-semibold tracking-display text-balance text-paper sm:text-6xl"
        >
          {title}
        </h2>
        <div>
          <p className="text-lg leading-relaxed text-silver-400">{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryCta.href} className={buttonClass("primary")}>
              {primaryCta.label}
              <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
            </Link>
            <Link href={secondaryCta.href} className={buttonClass("secondary")}>
              {secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
