import { RailNav } from "./rail-nav";

// Desktop only: a narrow icon rail under the top bar. Small screens use <MobileNav>.
export function AppRail() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] border-r border-line bg-ink-900 py-3 lg:block">
      <RailNav />
    </aside>
  );
}
