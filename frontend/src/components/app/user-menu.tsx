"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { SessionUser } from "@/mocks/session";

interface UserMenuProps {
  user: SessionUser;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Native popover: the browser handles open/close, Esc, click-outside and focus.
export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  function signOut() {
    // MOCK until C1: will call POST /api/auth/logout first.
    router.push("/login");
  }

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
        className="fixed top-14 right-4 bottom-auto left-auto m-0 mt-1 w-64 rounded-md border border-line bg-ink-900 p-1 text-sm shadow-[0_16px_48px_-12px_rgb(0_0_0/0.8)]"
      >
        <div className="border-b border-line px-3 py-3">
          <p className="truncate text-paper">{user.name}</p>
          <p className="truncate font-mono text-xs text-silver-500">
            {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-1 flex h-9 w-full items-center gap-3 rounded-sm px-3 text-silver-300 transition-colors hover:bg-ink-850 hover:text-paper"
        >
          <LogOut aria-hidden className="size-4" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </>
  );
}
