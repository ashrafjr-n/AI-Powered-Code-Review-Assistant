import { unzipSync, zipSync } from "fflate";

// The browser slims the ZIP before upload: most of a zipped project is node_modules,
// .git and build output, which the backend throws away anyway. Only source files are
// sent. The backend filters again and keeps its 10 MB limit (backend/src/files/unzip.ts):
// this is convenience, not security.

/** Biggest ZIP the user can pick (it is slimmed in memory, in the browser). */
export const MAX_PICKED_ZIP_BYTES = 200 * 1024 * 1024;
/** Must match MAX_ZIP_BYTES in backend/src/files/unzip.ts. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_FILE_BYTES = 512 * 1024;

// Same lists as the backend (the two apps share no code, decision D4).
const SKIP_FOLDERS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  "vendor",
  "target",
  "__pycache__",
  ".venv",
  "venv",
  "__MACOSX",
]);
const SKIP_FILES = new Set([
  ".DS_Store",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

export function zipProblem(name: string, size: number): string | null {
  if (!name.toLowerCase().endsWith(".zip")) return "Choose a .zip file.";
  if (size === 0) return "This ZIP file is empty.";
  if (size > MAX_PICKED_ZIP_BYTES) return "The ZIP is larger than 200 MB.";
  return null;
}

function skipped(name: string): boolean {
  const parts = name.split("/");
  return (
    name.endsWith("/") ||
    parts.some((part) => SKIP_FOLDERS.has(part)) ||
    SKIP_FILES.has(parts[parts.length - 1])
  );
}

const utf8 = new TextDecoder("utf-8", { fatal: true });

function isText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    utf8.decode(bytes);
    return true;
  } catch {
    return false;
  }
}

export type SlimResult =
  | { ok: true; zip: Uint8Array<ArrayBuffer>; fileCount: number }
  | { ok: false; error: string };

/**
 * Keeps only readable source files and re-zips them. Skipped entries are never
 * inflated, so a huge node_modules costs almost nothing.
 */
// ponytail: runs on the main thread; move to fflate's async unzip (Web Workers) if
// big ZIPs make the page freeze.
export function slimZip(zip: Uint8Array): SlimResult {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip, {
      filter: (entry) =>
        !skipped(entry.name) && entry.originalSize <= MAX_FILE_BYTES,
    });
  } catch {
    return { ok: false, error: "This file is not a valid ZIP archive." };
  }

  const kept = Object.fromEntries(
    Object.entries(entries).filter(([, bytes]) => isText(bytes)),
  );
  const fileCount = Object.keys(kept).length;
  if (fileCount === 0)
    return {
      ok: false,
      error: "No readable source files were found in this ZIP.",
    };

  // fflate always allocates a plain ArrayBuffer (never shared), which Blob needs.
  const slim = zipSync(kept) as Uint8Array<ArrayBuffer>;
  if (slim.length > MAX_UPLOAD_BYTES)
    return {
      ok: false,
      error:
        "Your source code is larger than 10 MB, even without dependencies and build output.",
    };
  return { ok: true, zip: slim, fileCount };
}
