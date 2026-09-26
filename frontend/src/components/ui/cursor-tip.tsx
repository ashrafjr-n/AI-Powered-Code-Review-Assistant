"use client";

import { useState } from "react";
import type { FocusEvent, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Tip {
  label: string;
  left: number;
  top: number;
}

const WIDTH = 320; // max label width, keeps it inside the window

/**
 * A small label that follows the mouse while hovering, or sits next to the element on
 * keyboard focus. Visual only (aria-hidden): the element must carry its own
 * accessible name or description.
 */
export function useCursorTip() {
  const [tip, setTip] = useState<Tip | null>(null);

  const handlers = (label: string) => ({
    onPointerMove: (event: PointerEvent) =>
      setTip({
        label,
        left: Math.min(event.clientX + 14, window.innerWidth - WIDTH - 8),
        top: event.clientY + 14,
      }),
    onPointerLeave: () => setTip(null),
    onFocus: (event: FocusEvent<HTMLElement>) => {
      const box = event.currentTarget.getBoundingClientRect();
      setTip({
        label,
        left: Math.min(box.right + 10, window.innerWidth - WIDTH - 8),
        top: box.top + box.height / 2 - 12,
      });
    },
    onBlur: () => setTip(null),
    onClick: () => setTip(null),
  });

  const element = tip && (
    <span
      aria-hidden
      className="pointer-events-none fixed z-50 max-w-80 rounded-sm border border-line-strong bg-ink-800 px-2 py-1 font-mono text-xs leading-relaxed text-paper shadow-[0_8px_24px_-8px_rgb(0_0_0/0.8)]"
      style={{ left: tip.left, top: tip.top }}
    >
      {tip.label}
    </span>
  );

  return { handlers, element };
}

interface HoverNoteProps {
  note: string;
  children: ReactNode;
  className?: string;
}

/** Wraps server-rendered content with a cursor-following note. */
export function HoverNote({ note, children, className }: HoverNoteProps) {
  const { handlers, element } = useCursorTip();
  return (
    <span {...handlers(note)} className={cn(className)}>
      {children}
      {element}
    </span>
  );
}
