import Link from "next/link";
import { FolderX } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Shown inside the app shell when a project or review id doesn't exist (or isn't yours).
export default function ProjectNotFound() {
  return (
    <div className="mx-auto max-w-xl py-16">
      <EmptyState
        icon={FolderX}
        titleAs="h1"
        title="Project not found"
        body="It may have been deleted, or the link is wrong."
        action={
          <Link href="/projects" className={buttonClass("primary")}>
            Back to projects
          </Link>
        }
      />
    </div>
  );
}
