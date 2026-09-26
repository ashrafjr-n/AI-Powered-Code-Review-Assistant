"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

// Native <dialog> as a modal: the browser traps focus, closes on Esc,
// makes the page behind it inert, and returns focus to the opener.
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Sync React state with the DOM API (showModal/close have no attribute equivalent).
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-line bg-ink-900 p-0 text-silver-300 shadow-[0_24px_80px_-12px_rgb(0_0_0/0.9)] backdrop:bg-ink-950/80"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="space-y-1">
          <h2 id={titleId} className="font-medium text-paper">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-silver-400">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-7 shrink-0 items-center justify-center rounded-sm text-silver-500 transition-colors hover:bg-ink-850 hover:text-paper"
        >
          <X aria-hidden className="size-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className="px-5 py-5">{children}</div>
    </dialog>
  );
}
