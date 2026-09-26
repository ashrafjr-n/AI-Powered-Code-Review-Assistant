"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import type { SessionUser } from "@/lib/types";

interface UserMenuProps {
  user: SessionUser;
  /** "app" = the app's top bar (56px); "site" = the landing header (64px, centered 1200px container). */
  placement?: "app" | "site";
}

// The menu lives in the top layer (popover), so it is placed against the viewport:
// under the header, aligned with the right edge of the header's content.
const MENU_POSITION = {
  app: "top-14 right-4",
  site: "top-16 right-[max(1rem,calc((100vw-1200px)/2+2rem))]",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Native popover: the browser handles open/close, Esc, click-outside and focus.
export function UserMenu({ user, placement = "app" }: UserMenuProps) {
  return (
    <>
      <button
        type="button"
        popoverTarget="user-menu"
        aria-label={`Account menu for ${user.name}`}
        className="flex size-8 items-center justify-center rounded-sm border border-line-strong bg-ink-800 font-mono text-xs text-paper transition-colors hover:border-silver-500"
      >
        {initials(user.name)}
      </button>
      <div
        id="user-menu"
        popover="auto"
        className={`fixed ${MENU_POSITION[placement]} bottom-auto left-auto m-0 mt-1 w-64 rounded-md border border-line bg-ink-900 p-1 text-sm shadow-[0_16px_48px_-12px_rgb(0_0_0/0.8)]`}
      >
        <div className="border-b border-line px-3 py-3">
          <p className="truncate text-paper">{user.name}</p>
          <p className="truncate font-mono text-xs text-silver-500">
            {user.email}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-1 flex h-9 w-full items-center gap-3 rounded-sm px-3 text-silver-300 transition-colors hover:bg-ink-850 hover:text-paper"
          >
            <LogOut aria-hidden className="size-4" strokeWidth={1.5} />
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
