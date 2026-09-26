import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ProjectContextProps {
  name: string;
  fileCount: number;
  description: string;
  backHref: string;
  backLabel: string;
  /** The workspace uses the project name as its page heading; the report page has its own h1. */
  asHeading: boolean;
}

// Project info in the top bar: back, name, file count, and the start of the description.
export function ProjectContext({
  name,
  fileCount,
  description,
  backHref,
  backLabel,
  asHeading,
}: ProjectContextProps) {
  const Name = asHeading ? "h1" : "p";
  return (
    <div
      data-page-context
      className="flex h-8 min-w-0 items-center gap-2 border-l border-line pl-3 sm:gap-3"
    >
      <Link
        href={backHref}
        aria-label={backLabel}
        className="flex size-8 shrink-0 items-center justify-center rounded-sm text-silver-400 transition-colors hover:bg-ink-850 hover:text-paper"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.5} />
      </Link>
      <Name className="min-w-0 truncate text-sm font-medium text-paper">
        {name}
      </Name>
      <span className="hidden shrink-0 font-mono text-xs text-silver-500 sm:inline">
        {fileCount} {fileCount === 1 ? "file" : "files"}
      </span>
      {description && (
        <span
          title={description}
          className="hidden max-w-80 min-w-0 truncate border-l border-line pl-3 text-xs text-silver-500 md:inline"
        >
          {description}
        </span>
      )}
    </div>
  );
}
