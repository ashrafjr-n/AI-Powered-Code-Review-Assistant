"use client";

import { useState } from "react";
import type { FocusEvent, PointerEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/content/app-nav";
import { cn } from "@/lib/cn";

interface Tip {
  label: string;
  left: number;
  top: number;
}

// Desktop rail: icons only. The name shows in a small label that follows the mouse
// while hovering, or sits next to the icon on keyboard focus. Links keep an aria-label,
// so screen readers never depend on the visual label.
export function RailNav() {
  const pathname = usePathname();
  const [tip, setTip] = useState<Tip | null>(null);
  const activeIndex = appNav.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  const follow = (label: string) => (event: PointerEvent) =>
    setTip({ label, left: event.clientX + 14, top: event.clientY + 14 });
  const beside = (label: string) => (event: FocusEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setTip({ label, left: box.right + 10, top: box.top + box.height / 2 - 12 });
  };

  return (
    <nav aria-label="App">
      <ul className="relative flex flex-col items-center gap-1">
        {/* One indicator that slides to the active icon (items are 40px + 4px gap;
            the 20px line is centered on the 40px icon). */}
        <li
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0 left-0 h-5 w-0.5 rounded-full bg-silver-200 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            activeIndex === -1 && "opacity-0",
          )}
          style={{ translate: `0 ${Math.max(activeIndex, 0) * 44 + 10}px` }}
        />
        {appNav.map(({ label, href, icon: Icon }, index) => {
          const active = index === activeIndex;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onPointerMove={follow(label)}
                onPointerLeave={() => setTip(null)}
                onFocus={beside(label)}
                onBlur={() => setTip(null)}
                onClick={() => setTip(null)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-sm transition-colors duration-200",
                  active
                    ? "bg-ink-850 text-paper"
                    : "text-silver-500 hover:bg-ink-850 hover:text-paper",
                )}
              >
                <Icon aria-hidden className="size-[18px]" strokeWidth={1.5} />
              </Link>
            </li>
          );
        })}
      </ul>
      {tip && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-50 rounded-sm border border-line-strong bg-ink-800 px-2 py-1 font-mono text-xs whitespace-nowrap text-paper shadow-[0_8px_24px_-8px_rgb(0_0_0/0.8)]"
          style={{ left: tip.left, top: tip.top }}
        >
          {tip.label}
        </span>
      )}
    </nav>
  );
}
