import { unzipSync } from 'fflate';
import { isSensitivePath, redactSecrets } from './sensitive.js';

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
  // Tool caches and build output of common frameworks.
  '.vite',
  '.turbo',
  '.cache',
  '.parcel-cache',
  '.svelte-kit',
  '.nuxt',
  '.output',
  '.vercel',
  '.wrangler',
  '.expo',
  '.angular',
  '.gradle',
  '.pytest_cache',
  '.mypy_cache',
  '.tox',
  'bower_components',
  '.yarn',
  '.pnpm-store',
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
  /** Env/key/credential file: path only, content is "" (see sensitive.ts). */
  sensitive: boolean;
}

/** Why files were left out, so the UI can say "580 kept · 1,240 skipped". */
export type SkipCounts = {
  /** Dependencies, build output, caches, lock files, generated files. */
  ignored: number;
  binary: number;
  tooLarge: number;
};

export interface ExtractResult {
  files: ExtractedFile[];
  skipped: SkipCounts;
  /** How many secrets inside code were replaced with ‹redacted›. */
  redacted: number;
}

export class InvalidZipError extends Error {}

/**
 * "a\\b/../c" and "/etc/x" are rejected; "./src/a.ts" (some zip tools write this)
 * becomes "src/a.ts". Returns a clean relative path or null.
 */
function safePath(name: string): string | null {
  const parts = name
    .replaceAll('\\', '/')
    .split('/')
    .filter((part) => part && part !== '.');
  if (name.startsWith('/') || parts.includes('..')) return null;
  return parts.join('/');
}

// Generated files: minified bundles and source maps are not code anyone reviews.
const GENERATED_FILE = /\.(min\.(js|css)|map)$/;

function isIgnored(path: string): boolean {
  const parts = path.split('/');
  const name = parts[parts.length - 1];
  return (
    parts.some((part) => SKIP_FOLDERS.has(part)) ||
    SKIP_FILES.has(name) ||
    GENERATED_FILE.test(name)
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

/**
 * Unzips in memory and keeps readable text files (secrets redacted) plus sensitive files
 * by path only. Throws InvalidZipError.
 */
export function extractZip(zip: Uint8Array): ExtractResult {
  let total = 0;
  const skipped: SkipCounts = { ignored: 0, binary: 0, tooLarge: 0 };
  const sensitive: ExtractedFile[] = [];
  const seen = new Set<string>();
  // Files that would be stored, counted before anything is inflated, so a ZIP with a
  // huge number of entries is refused early (binaries still count: they are only
  // found after inflating).
  let stored = 0;
  const countFile = () => {
    if (++stored > MAX_FILES)
      throw new InvalidZipError(
        `The ZIP has more than ${MAX_FILES} source files.`,
      );
  };
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip, {
      // Runs before a file is inflated, so skipped files cost nothing.
      filter: (entry) => {
        const path = safePath(entry.name);
        if (!path || entry.name.endsWith('/')) return false;
        // "a/b.ts" and "a//b.ts" clean to the same path, but a project has one row
        // per path: keep the first, skip the copy.
        if (seen.has(path)) {
          skipped.ignored++;
          return false;
        }
        seen.add(path);
        if (isIgnored(path)) {
          skipped.ignored++;
          return false;
        }
        // Never inflated: we keep the path so the tree shows the file exists.
        if (isSensitivePath(path)) {
          countFile();
          sensitive.push({
            path,
            content: '',
            size: entry.originalSize,
            sensitive: true,
          });
          return false;
        }
        if (entry.originalSize > MAX_FILE_BYTES) {
          skipped.tooLarge++;
          return false;
        }
        countFile();
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

  let redacted = 0;
  const files: ExtractedFile[] = [];
  for (const [name, bytes] of Object.entries(entries)) {
    const text = asText(bytes);
    if (text === null) {
      skipped.binary++;
      continue;
    }
    const clean = redactSecrets(text);
    redacted += clean.count;
    files.push({
      path: safePath(name)!,
      content: clean.content,
      size: Buffer.byteLength(clean.content),
      sensitive: false,
    });
  }
  if (files.length === 0)
    throw new InvalidZipError(
      'No readable source files were found in this ZIP.',
    );
  return {
    files: stripSharedRoot([...files, ...sensitive]).sort((a, b) =>
      a.path.localeCompare(b.path),
    ),
    skipped,
    redacted,
  };
}
