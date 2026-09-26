import Link from "next/link";
import { UserMenu } from "@/components/app/user-menu";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import type { NavLink } from "@/content/landing";
import type { SessionUser } from "@/lib/types";

interface SiteHeaderProps {
  links: NavLink[];
  cta: NavLink;
  /** Signed in → the same account menu as in the app; signed out → "Sign in". */
  user: SessionUser | null;
}

export function SiteHeader({ links, cta, user }: SiteHeaderProps) {
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
          {user ? (
            <UserMenu user={user} placement="site" />
          ) : (
            <Link href="/login" className={buttonClass("ghost", "sm")}>
              Sign in
            </Link>
          )}
          <Link href={cta.href} className={buttonClass("primary", "sm")}>
            {cta.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
