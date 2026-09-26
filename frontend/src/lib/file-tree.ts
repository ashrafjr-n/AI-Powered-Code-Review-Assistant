// Turns flat file paths ("src/app/page.tsx") into a folder tree for the explorer.

export interface TreeFile {
  type: "file";
  name: string;
  path: string;
  size: number;
}

export interface TreeFolder {
  type: "folder";
  name: string;
  path: string;
  children: TreeNode[];
}

export type TreeNode = TreeFile | TreeFolder;

// Folders first, then files; each group A→Z.
function sortNodes(nodes: TreeNode[]): TreeNode[] {
  nodes.sort((a, b) =>
    a.type === b.type
      ? a.name.localeCompare(b.name)
      : a.type === "folder"
        ? -1
        : 1,
  );
  for (const node of nodes) {
    if (node.type === "folder") sortNodes(node.children);
  }
  return nodes;
}

export function buildFileTree(
  files: { path: string; size: number }[],
): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let level = root;
    parts.slice(0, -1).forEach((name, index) => {
      const path = parts.slice(0, index + 1).join("/");
      let folder = level.find(
        (node): node is TreeFolder =>
          node.type === "folder" && node.name === name,
      );
      if (!folder) {
        folder = { type: "folder", name, path, children: [] };
        level.push(folder);
      }
      level = folder.children;
    });
    level.push({
      type: "file",
      name: parts[parts.length - 1],
      path: file.path,
      size: file.size,
    });
  }

  return sortNodes(root);
}
