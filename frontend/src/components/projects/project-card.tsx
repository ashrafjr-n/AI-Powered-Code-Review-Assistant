import Link from "next/link";
import { IssueBlocks } from "@/components/ui/issue-blocks";
import { formatDate } from "@/lib/format";
import type { ProjectSummary } from "@/lib/types";
import { DeleteProjectButton } from "./delete-project-button";

interface ProjectCardProps {
  project: ProjectSummary;
}

function reviewStatus(project: ProjectSummary): string | null {
  if (!project.lastReview) {
    return project.fileCount === 0 ? "No code yet" : "Not reviewed yet";
  }
  // Old counts would describe code that is gone.
  if (project.lastReview.outdated) return "Code changed since last review";
  return project.lastReview.severity ? null : "Clean last review";
}

// The whole card is clickable (stretched link); the delete button sits above it.
export function ProjectCard({ project }: ProjectCardProps) {
  const status = reviewStatus(project);
  const severity = project.lastReview?.outdated
    ? null
    : project.lastReview?.severity;

  return (
    <li className="group relative flex flex-col rounded-md border border-line bg-ink-900 p-5 transition-colors focus-within:border-line-strong hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium text-paper">
          <Link
            href={`/projects/${project.id}`}
            className="after:absolute after:inset-0 after:rounded-md focus-visible:outline-none"
          >
            {project.name}
          </Link>
        </h2>
        <DeleteProjectButton
          projectId={project.id}
          projectName={project.name}
          fileCount={project.fileCount}
        />
      </div>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-silver-400">
        {project.description || "No description."}
      </p>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 font-mono text-xs text-silver-500">
        <span>
          {project.fileCount} files · {formatDate(project.createdAt)}
        </span>
        {project.lastReview && severity ? (
          // One block per issue of the latest review (1 critical = one red block).
          <IssueBlocks counts={project.lastReview.counts} max={12} size="sm" />
        ) : (
          <span>{status}</span>
        )}
      </div>
    </li>
  );
}
