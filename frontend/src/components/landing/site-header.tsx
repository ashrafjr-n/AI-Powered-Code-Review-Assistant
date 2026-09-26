import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import type { NavLink } from "@/content/landing";

interface SiteHeaderProps {
  links: NavLink[];
}

export function SiteHeader({ links }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-950">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-8">
        <Link href="/" aria-label="Redline home" className="shrink-0">
          <Logo className="h-6 w-auto" />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-silver-400 transition-colors hover:text-paper"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonClass("ghost", "sm")}>
            Sign in
          </Link>
          <Link href="/register" className={buttonClass("primary", "sm")}>
            Start reviewing
          </Link>
        </div>
      </div>
    </header>
  );
}
