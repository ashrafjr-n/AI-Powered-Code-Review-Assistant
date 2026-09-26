import { FolderClosed, History, SlidersHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AppNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const appNav: AppNavItem[] = [
  { label: "Projects", href: "/projects", icon: FolderClosed },
  { label: "Reviews", href: "/reviews", icon: History },
  { label: "Settings", href: "/settings/providers", icon: SlidersHorizontal },
];
