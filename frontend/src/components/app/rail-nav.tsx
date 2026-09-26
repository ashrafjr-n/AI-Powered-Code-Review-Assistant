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

  const follow = (label: string) => (event: PointerEvent) =>
    setTip({ label, left: event.clientX + 14, top: event.clientY + 14 });
  const beside = (label: string) => (event: FocusEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setTip({ label, left: box.right + 10, top: box.top + box.height / 2 - 12 });
  };

  return (
    <nav aria-label="App">
      <ul className="flex flex-col items-center gap-1">
        {appNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
                  "relative flex size-10 items-center justify-center rounded-sm transition-colors",
                  "before:absolute before:top-2.5 before:-left-3 before:h-5 before:w-0.5 before:rounded-full before:transition-colors",
                  active
                    ? "bg-ink-850 text-paper before:bg-silver-200"
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
