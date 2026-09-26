import { unzipSync } from 'fflate';

// Upload limits. The frontend checks MAX_ZIP_BYTES too (frontend/src/lib/upload.ts),
// but only this side is trusted.
export const MAX_ZIP_BYTES = 10 * 1024 * 1024;
const MAX_FILE_BYTES = 512 * 1024; // one source file; bigger ones are data, not code
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // all unpacked files together (zip bomb guard)
const MAX_FILES = 2000;

// Folders and files that are never worth reviewing.
const SKIP_FOLDERS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
  'vendor',
  'target',
  '__pycache__',
  '.venv',
  'venv',
  '__MACOSX',
]);
const SKIP_FILES = new Set([
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
]);

export interface ExtractedFile {
  path: string;
  content: string;
  size: number;
}

export class InvalidZipError extends Error {}

/** "a\\b/../c" and "/etc/x" are rejected; returns a clean relative path or null. */
function safePath(name: string): string | null {
  const parts = name.replaceAll('\\', '/').split('/').filter(Boolean);
  if (
    name.startsWith('/') ||
    parts.some((part) => part === '..' || part === '.')
  )
    return null;
  return parts.join('/');
}

function skipped(path: string): boolean {
  const parts = path.split('/');
  return (
    parts.some((part) => SKIP_FOLDERS.has(part)) ||
    SKIP_FILES.has(parts[parts.length - 1])
  );
}

// fatal: invalid UTF-8 throws → we treat the file as binary.
const utf8 = new TextDecoder('utf-8', { fatal: true });

function asText(bytes: Uint8Array): string | null {
  if (bytes.includes(0)) return null; // NUL byte = binary (Postgres TEXT can't store it either)
  try {
    return utf8.decode(bytes);
  } catch {
    return null;
  }
}

/**
 * GitHub-style ZIPs wrap everything in one folder ("repo-main/src/…").
 * Drop that folder so paths start at the project root.
 */
function stripSharedRoot(files: ExtractedFile[]): ExtractedFile[] {
  const first = files[0]?.path.split('/')[0];
  const shared =
    first !== undefined &&
    files.every((file) => file.path.startsWith(`${first}/`));
  if (!shared) return files;
  return files.map((file) => ({
    ...file,
    path: file.path.slice(first.length + 1),
  }));
}

/** Unzips in memory and keeps only readable text files. Throws InvalidZipError. */
export function extractZip(zip: Uint8Array): ExtractedFile[] {
  let total = 0;
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip, {
      // Runs before a file is inflated, so skipped files cost nothing.
      filter: (entry) => {
        const path = safePath(entry.name);
        if (!path || entry.name.endsWith('/') || skipped(path)) return false;
        if (entry.originalSize > MAX_FILE_BYTES) return false;
        // fflate inflates into a buffer of exactly originalSize, so a lying header
        // can't produce more bytes than we counted here.
        total += entry.originalSize;
        if (total > MAX_TOTAL_BYTES)
          throw new InvalidZipError(
            'The unpacked project is larger than 50 MB.',
          );
        return true;
      },
    });
  } catch (error) {
    if (error instanceof InvalidZipError) throw error;
    throw new InvalidZipError('This file is not a valid ZIP archive.');
  }

  const files: ExtractedFile[] = [];
  for (const [name, bytes] of Object.entries(entries)) {
    const content = asText(bytes);
    if (content === null) continue;
    files.push({ path: safePath(name)!, content, size: bytes.length });
  }
  if (files.length === 0)
    throw new InvalidZipError(
      'No readable source files were found in this ZIP.',
    );
  if (files.length > MAX_FILES)
    throw new InvalidZipError(
      `The ZIP has more than ${MAX_FILES} source files.`,
    );
  return stripSharedRoot(files).sort((a, b) => a.path.localeCompare(b.path));
}
