"use client";

import { useRef } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "./sidebar-nav";

// Small screens: a left sheet built on the native popover.
export function MobileNav() {
  const sheetRef = useRef<HTMLDivElement>(null);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        popoverTarget="mobile-nav"
        aria-label="Open navigation"
        className="flex size-8 items-center justify-center rounded-sm text-silver-300 transition-colors hover:bg-ink-850 hover:text-paper"
      >
        <Menu aria-hidden className="size-5" strokeWidth={1.5} />
      </button>
      <div
        ref={sheetRef}
        id="mobile-nav"
        popover="auto"
        className="fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-72 border-r border-line bg-ink-900 backdrop:bg-ink-950/70"
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <Logo className="h-5 w-auto" />
          <button
            type="button"
            popoverTarget="mobile-nav"
            popoverTargetAction="hide"
            aria-label="Close navigation"
            className="flex size-8 items-center justify-center rounded-sm text-silver-300 hover:bg-ink-850 hover:text-paper"
          >
            <X aria-hidden className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-3">
          <SidebarNav onNavigate={() => sheetRef.current?.hidePopover()} />
        </div>
      </div>
    </div>
  );
}
