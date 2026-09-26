import Link from "next/link";
import { ChevronRight, FileCode2, Folder } from "lucide-react";
import type { TreeNode } from "@/lib/file-tree";
import { cn } from "@/lib/cn";
import { workspaceHref, type WorkspaceTab } from "@/lib/workspace-url";

interface FileTreeProps {
  projectId: string;
  nodes: TreeNode[];
  selectedPath?: string;
  tab: WorkspaceTab;
  /** Adds checkboxes that belong to the review form (via the form attribute). */
  selectForm?: string;
}

// Plain nested lists + native <details> for folders: accessible without custom
// keyboard code (role="tree" would promise arrow-key navigation we don't build).
export function FileTree(props: FileTreeProps) {
  return (
    <nav aria-label="Project files">
      <ul className="font-mono text-[13px]">
        <TreeLevel {...props} depth={0} />
      </ul>
    </nav>
  );
}

function TreeLevel({
  projectId,
  nodes,
  selectedPath,
  tab,
  selectForm,
  depth,
}: FileTreeProps & { depth: number }) {
  const indent = { paddingLeft: `${depth * 12 + 8}px` };

  return nodes.map((node) =>
    node.type === "folder" ? (
      <li key={node.path}>
        <details open className="group/folder">
          <summary
            style={indent}
            className="flex h-7 cursor-pointer list-none items-center gap-1.5 rounded-sm pr-2 text-silver-400 hover:bg-ink-850 hover:text-paper [&::-webkit-details-marker]:hidden"
          >
            <ChevronRight
              aria-hidden
              className="size-3.5 shrink-0 transition-transform group-open/folder:rotate-90"
              strokeWidth={1.5}
            />
            <Folder
              aria-hidden
              className="size-3.5 shrink-0"
              strokeWidth={1.5}
            />
            <span className="truncate">{node.name}</span>
          </summary>
          <ul>
            <TreeLevel
              projectId={projectId}
              nodes={node.children}
              selectedPath={selectedPath}
              tab={tab}
              selectForm={selectForm}
              depth={depth + 1}
            />
          </ul>
        </details>
      </li>
    ) : (
      <li
        key={node.path}
        style={indent}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-sm pr-2",
          node.path === selectedPath
            ? "bg-ink-850 text-paper"
            : "text-silver-300 hover:bg-ink-850 hover:text-paper",
        )}
      >
        {selectForm ? (
          <input
            type="checkbox"
            name="files"
            value={node.path}
            form={selectForm}
            aria-label={`Select ${node.path} for review`}
            className="ml-[5px] size-3.5 shrink-0 accent-silver-200"
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <FileCode2
          aria-hidden
          className="size-3.5 shrink-0 text-silver-500"
          strokeWidth={1.5}
        />
        <Link
          href={workspaceHref(projectId, { file: node.path, tab })}
          aria-current={node.path === selectedPath ? "page" : undefined}
          className="min-w-0 flex-1 truncate focus-visible:outline-offset-0"
        >
          {node.name}
        </Link>
      </li>
    ),
  );
}
