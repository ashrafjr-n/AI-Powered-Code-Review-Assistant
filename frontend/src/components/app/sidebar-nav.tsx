"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/content/app-nav";
import { cn } from "@/lib/cn";

// The nav list is imported here, not passed as a prop: icons are components (functions),
// and a Server Component can't pass functions to a Client Component.
interface SidebarNavProps {
  /** Called after a link is clicked (the mobile sheet uses it to close). */
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="App">
      <ul className="space-y-1">
        {appNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-sm px-3 text-sm transition-colors",
                  active
                    ? "bg-ink-850 text-paper"
                    : "text-silver-400 hover:bg-ink-850 hover:text-paper",
                )}
              >
                <Icon aria-hidden className="size-4" strokeWidth={1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
