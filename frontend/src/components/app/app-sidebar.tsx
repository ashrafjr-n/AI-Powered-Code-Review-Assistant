import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "./sidebar-nav";

// Desktop only. On small screens the same nav lives in <MobileNav>.
export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-ink-900 lg:flex">
      <div className="flex h-14 items-center border-b border-line px-5">
        <Link href="/projects" aria-label="Redline projects">
          <Logo className="h-5 w-auto" />
        </Link>
      </div>
      <div className="flex-1 p-3">
        <SidebarNav />
      </div>
    </aside>
  );
}
