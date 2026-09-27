import Link from "next/link";
import { ChevronRight, FileCode2, Folder, LockKeyhole } from "lucide-react";
import { HoverNote } from "@/components/ui/cursor-tip";
import { LinkPending } from "@/components/ui/link-pending";
import { privacyText } from "@/content/privacy";
import type { TreeFile, TreeNode } from "@/lib/file-tree";
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
      <FileRow
        key={node.path}
        node={node}
        indent={indent}
        selected={node.path === selectedPath}
        href={workspaceHref(projectId, { file: node.path, tab })}
        selectForm={selectForm}
      />
    ),
  );
}

interface FileRowProps {
  node: TreeFile;
  indent: { paddingLeft: string };
  selected: boolean;
  href: ReturnType<typeof workspaceHref>;
  selectForm?: string;
}

function FileRow({ node, indent, selected, href, selectForm }: FileRowProps) {
  const label = (
    <>
      {node.sensitive ? (
        <LockKeyhole
          aria-hidden
          className="size-3.5 shrink-0"
          strokeWidth={1.5}
        />
      ) : (
        <FileCode2
          aria-hidden
          className="size-3.5 shrink-0 text-silver-500"
          strokeWidth={1.5}
        />
      )}
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        className="flex min-w-0 flex-1 items-center gap-1.5 focus-visible:outline-offset-0"
      >
        <span className="truncate">
          {node.name}
          {node.sensitive && (
            <span className="sr-only"> (hidden for privacy)</span>
          )}
        </span>
        {/* Opening a file renders the page on the server: show the click was heard. */}
        <LinkPending className="size-1.5 shrink-0 rounded-full" />
      </Link>
    </>
  );
  const labelClass = "flex h-full min-w-0 flex-1 items-center gap-1.5";

  return (
    <li
      style={indent}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-sm pr-2",
        selected
          ? "bg-ink-850 text-paper"
          : "hover:bg-ink-850 hover:text-paper",
        node.sensitive
          ? "text-silver-500 italic"
          : !selected && "text-silver-300",
      )}
    >
      {selectForm ? (
        <input
          type="checkbox"
          name="files"
          value={node.path}
          form={selectForm}
          // Hidden files are never reviewed, so they can't be picked.
          disabled={node.sensitive}
          aria-label={
            node.sensitive
              ? `${node.path} is hidden for privacy`
              : `Select ${node.path} for review`
          }
          className="ml-[5px] size-3.5 shrink-0 accent-silver-200 disabled:opacity-30"
        />
      ) : (
        <span className="w-3.5 shrink-0" />
      )}
      {node.sensitive ? (
        <HoverNote note={privacyText.hiddenFileNote} className={labelClass}>
          {label}
        </HoverNote>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
    </li>
  );
}
