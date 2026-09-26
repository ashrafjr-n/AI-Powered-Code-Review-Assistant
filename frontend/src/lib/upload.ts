import { unzipSync, zipSync } from "fflate";
import { isSensitivePath } from "./sensitive.ts";
import type { SkipCounts } from "./types";

// The browser slims the ZIP before upload: most of a zipped project is node_modules,
// .git and build output, which the backend throws away anyway. Only source files are
// sent. The backend filters again and keeps its 10 MB limit (backend/src/files/unzip.ts):
// this is convenience, not security.

/** Biggest ZIP the user can pick (it is slimmed in memory, in the browser). */
export const MAX_PICKED_ZIP_BYTES = 200 * 1024 * 1024;
/** Must match MAX_ZIP_BYTES in backend/src/files/unzip.ts. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
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
  // Tool caches and build output of common frameworks.
  ".vite",
  ".turbo",
  ".cache",
  ".parcel-cache",
  ".svelte-kit",
  ".nuxt",
  ".output",
  ".vercel",
  ".wrangler",
  ".expo",
  ".angular",
  ".gradle",
  ".pytest_cache",
  ".mypy_cache",
  ".tox",
  "bower_components",
  ".yarn",
  ".pnpm-store",
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

// Generated files: minified bundles and source maps.
const GENERATED_FILE = /\.(min\.(js|css)|map)$/;

function skippedPath(name: string): boolean {
  const parts = name.split("/");
  const file = parts[parts.length - 1];
  return (
    parts.some((part) => SKIP_FOLDERS.has(part)) ||
    SKIP_FILES.has(file) ||
    GENERATED_FILE.test(file)
  );
}

/** Folders never opened (dependencies, build output, caches). */
export function isSkippedFolder(name: string): boolean {
  return SKIP_FOLDERS.has(name);
}

/** The same rules for a ZIP entry and a dropped file, decided before reading it. */
function classify(
  path: string,
  size: number,
): "keep" | "sensitive" | "ignored" | "tooLarge" {
  if (skippedPath(path)) return "ignored";
  if (isSensitivePath(path)) return "sensitive";
  if (size > MAX_FILE_BYTES) return "tooLarge";
  return "keep";
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
  | {
      ok: true;
      zip: Uint8Array<ArrayBuffer>;
      fileCount: number;
      /** Sent with the upload so the workspace can say what was left out. */
      skipped: SkipCounts;
    }
  | { ok: false; error: string };

/**
 * The end of every upload: drop binaries, re-zip, check the size.
 * Sensitive files (.env, keys…) are added EMPTY: the tree still shows them, their
 * secrets stay on this computer.
 */
function pack(
  candidates: Record<string, Uint8Array>,
  sensitive: string[],
  skipped: SkipCounts,
): SlimResult {
  const kept: Record<string, Uint8Array> = {};
  for (const [name, bytes] of Object.entries(candidates)) {
    if (isText(bytes)) kept[name] = bytes;
    else skipped.binary++;
  }
  const fileCount = Object.keys(kept).length;
  if (fileCount === 0)
    return { ok: false, error: "No readable source files were found." };

  for (const name of sensitive) kept[name] = new Uint8Array(0);
  // fflate always allocates a plain ArrayBuffer (never shared), which Blob needs.
  const slim = zipSync(kept) as Uint8Array<ArrayBuffer>;
  if (slim.length > MAX_UPLOAD_BYTES)
    return {
      ok: false,
      error:
        "Your source code is larger than 10 MB, even without dependencies and build output.",
    };
  return { ok: true, zip: slim, fileCount, skipped };
}

/**
 * Keeps only readable source files of a ZIP and re-zips them. Skipped entries are
 * never inflated, so a huge node_modules costs almost nothing.
 */
// ponytail: runs on the main thread; move to fflate's async unzip (Web Workers) if
// big ZIPs make the page freeze.
export function slimZip(zip: Uint8Array): SlimResult {
  const skipped: SkipCounts = { ignored: 0, binary: 0, tooLarge: 0 };
  const sensitive: string[] = [];
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip, {
      filter: (entry) => {
        if (entry.name.endsWith("/")) return false;
        const verdict = classify(entry.name, entry.originalSize);
        if (verdict === "sensitive") sensitive.push(entry.name);
        else if (verdict !== "keep") skipped[verdict]++;
        return verdict === "keep";
      },
    });
  } catch {
    return { ok: false, error: "This file is not a valid ZIP archive." };
  }
  return pack(entries, sensitive, skipped);
}

/** A file picked or dropped on its own, with its path inside the project. */
export interface PickedFile {
  path: string;
  file: Blob;
}

/**
 * Same result as slimZip(), for loose files and folders. Only kept files are read.
 * `skippedFolders` = folders like node_modules that were never opened.
 */
export async function slimFiles(
  files: PickedFile[],
  skippedFolders = 0,
): Promise<SlimResult> {
  const skipped: SkipCounts = {
    ignored: skippedFolders,
    binary: 0,
    tooLarge: 0,
  };
  const sensitive: string[] = [];
  const candidates: Record<string, Uint8Array> = {};
  for (const { path, file } of files) {
    const name = path.replace(/^\/+/, "");
    const verdict = classify(name, file.size);
    if (verdict === "sensitive") sensitive.push(name);
    else if (verdict !== "keep") skipped[verdict]++;
    else candidates[name] = new Uint8Array(await file.arrayBuffer());
  }
  return pack(candidates, sensitive, skipped);
}
