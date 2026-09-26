import { isSkippedFolder, type PickedFile } from "./upload";

// Browser only: turns dropped files and folders into a flat list with project paths.

/**
 * Must run inside the drop event: the browser empties `dataTransfer` once the
 * event handler returns, so the entries are taken right away and read later.
 */
export function droppedEntries(data: DataTransfer): FileSystemEntry[] {
  return [...data.items]
    .map((item) => item.webkitGetAsEntry())
    .filter((entry) => entry !== null);
}

function fileOf(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function nextBatch(
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

/**
 * Walks folders. Skipped folders (node_modules, .git, build output…) are never opened,
 * so a folder with 100,000 dependency files is read in a moment.
 */
export async function readEntries(
  entries: FileSystemEntry[],
): Promise<{ files: PickedFile[]; skippedFolders: number }> {
  const files: PickedFile[] = [];
  let skippedFolders = 0;

  async function walk(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      // fullPath starts with "/": "/my-app/src/app.ts".
      const file = await fileOf(entry as FileSystemFileEntry);
      files.push({ path: entry.fullPath.slice(1), file });
      return;
    }
    if (isSkippedFolder(entry.name)) {
      skippedFolders++;
      return;
    }
    // readEntries() returns at most ~100 entries per call: read until it's empty.
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    let batch = await nextBatch(reader);
    while (batch.length > 0) {
      for (const child of batch) await walk(child);
      batch = await nextBatch(reader);
    }
  }

  for (const entry of entries) await walk(entry);
  return { files, skippedFolders };
}
