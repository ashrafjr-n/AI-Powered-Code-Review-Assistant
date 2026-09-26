import Link from "next/link";
import { ExternalLink, Gauge } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { demoLimitPanel as text } from "@/content/demo";
import { formatTimeLeft } from "@/lib/format";
import type { DemoNotice } from "@/lib/types";

// Shown instead of an error when the free demo can't answer: says why and how to
// continue with your own model. Neutral colors: nothing is broken.
export function DemoLimitPanel({ notice }: { notice: DemoNotice }) {
  const title =
    notice.kind === "busy"
      ? text.busyTitle
      : notice.kind === "site"
        ? text.siteTitle
        : text.userTitle;
  const reset = notice.resetsAt
    ? `They reset in ${formatTimeLeft(notice.resetsAt)} (00:00 UTC).`
    : null;

  return (
    <section
      role="status"
      aria-labelledby="demo-limit-title"
      className="space-y-3 rounded-md border border-line-strong bg-ink-850 p-4"
    >
      <h3
        id="demo-limit-title"
        className="flex items-start gap-2 text-sm font-medium text-paper"
      >
        <Gauge
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={1.5}
        />
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-silver-400">
        {notice.kind === "busy"
          ? text.busyBody
          : [notice.kind === "site" ? text.siteBody : null, reset]
              .filter(Boolean)
              .join(" ")}
      </p>
      <p className="text-sm text-silver-300">{text.stepsIntro}</p>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-silver-400 marker:font-mono marker:text-silver-500">
        {text.steps.map((step) => (
          <li key={step.text}>
            {step.text}{" "}
            {"link" in step && step.link && (
              <a
                href={step.link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-silver-200 underline underline-offset-2 hover:text-paper"
              >
                {step.link.label}
                <ExternalLink
                  aria-hidden
                  className="size-3"
                  strokeWidth={1.5}
                />
              </a>
            )}
          </li>
        ))}
      </ol>
      <p className="text-xs text-silver-500">{text.local}</p>
      <Link href="/settings/providers" className={buttonClass("primary", "sm")}>
        {text.cta}
      </Link>
    </section>
  );
}
