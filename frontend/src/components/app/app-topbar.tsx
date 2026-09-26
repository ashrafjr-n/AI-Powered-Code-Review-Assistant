import type { AiProvider, DemoStatus, SessionUser } from "@/lib/types";
import { MobileNav } from "./mobile-nav";
import { ProviderPill } from "./provider-pill";
import { UserMenu } from "./user-menu";

interface AppTopbarProps {
  user: SessionUser;
  provider: AiProvider | null;
  demo: DemoStatus;
}

export function AppTopbar({ user, provider, demo }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-ink-950 px-4 sm:px-6">
      <MobileNav />
      <div className="ml-auto flex min-w-0 items-center gap-3">
        <ProviderPill provider={provider} demo={demo} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
