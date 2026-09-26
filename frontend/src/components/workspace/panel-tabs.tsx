import Link from "next/link";
import { cn } from "@/lib/cn";
import { workspaceHref, type WorkspaceTab } from "@/lib/workspace-url";

const labels: Record<WorkspaceTab, string> = {
  review: "Review",
  chat: "Chat",
  insights: "Insights",
};

interface PanelTabsProps {
  projectId: string;
  active: WorkspaceTab;
  file?: string;
}

// Tabs are links: the active tab is in the URL, so back/forward and sharing work.
export function PanelTabs({ projectId, active, file }: PanelTabsProps) {
  return (
    <nav aria-label="Workspace panel" className="flex border-b border-line">
      {(Object.keys(labels) as WorkspaceTab[]).map((tab) => (
        <Link
          key={tab}
          href={workspaceHref(projectId, { tab, file })}
          aria-current={tab === active ? "page" : undefined}
          className={cn(
            "flex-1 border-b-2 py-3 text-center font-mono text-xs tracking-label uppercase transition-colors",
            tab === active
              ? "border-paper text-paper"
              : "border-transparent text-silver-500 hover:text-paper",
          )}
        >
          {labels[tab]}
        </Link>
      ))}
    </nav>
  );
}
