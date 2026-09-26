import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import type { AiProvider, DemoStatus, SessionUser } from "@/lib/types";
import { MobileNav } from "./mobile-nav";
import { ProviderPill } from "./provider-pill";
import { UserMenu } from "./user-menu";

interface AppTopbarProps {
  user: SessionUser;
  provider: AiProvider | null;
  demo: DemoStatus;
  /** Page context from the @context slot (e.g. the open project). */
  children: ReactNode;
}

export function AppTopbar({ user, provider, demo, children }: AppTopbarProps) {
  return (
    <header className="group/topbar sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-ink-950 pr-4 pl-4 sm:pr-6 lg:pl-[22px]">
      <MobileNav />
      {/* On desktop the mark sits right above the rail's icons (rail 64px, mark 20px).
          With page context (inside a project) only the mark shows, to leave room for it. */}
      <Link href="/projects" aria-label="Redline projects" className="shrink-0">
        <Logo
          markOnly
          className="h-5 w-auto sm:hidden sm:group-has-[[data-page-context]]/topbar:block"
        />
        <Logo className="hidden h-5 w-auto sm:block sm:group-has-[[data-page-context]]/topbar:hidden" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      <div className="flex shrink-0 items-center gap-3">
        <ProviderPill provider={provider} demo={demo} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
