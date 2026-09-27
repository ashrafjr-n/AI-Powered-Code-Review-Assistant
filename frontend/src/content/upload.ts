// Shown under the drop zone: what happens to uploaded code, so uploads are predictable.

export const uploadRules = [
  {
    title: "Kept",
    body: "Source code and other text files up to 512 KB each.",
  },
  {
    title: "Skipped in your browser",
    body: "node_modules, build output (dist, build, .next…), tool caches (.vite, .turbo…), lock files, minified files, source maps and binaries.",
  },
  {
    title: "Hidden for privacy",
    body: ".env files, private keys and credential files. Only their names are uploaded; the content stays on your computer.",
  },
  {
    title: "Redacted",
    body: "API keys, tokens and passwords written inside code are replaced with ‹redacted› before saving.",
  },
];

// The drop zone while an upload runs: one line per step, so a long wait never looks frozen.
export const uploadProgress = {
  preparing: "Preparing your files…",
  uploading: (files: number, size: string) =>
    `Uploading ${files.toLocaleString("en-US")} ${files === 1 ? "file" : "files"} (${size})…`,
  opening: "Opening the workspace…",
  // Shown only when the upload step is slow (see SLOW_UPLOAD_SECONDS).
  slowServer:
    "The server is waking up. Free hosting sleeps when nobody uses it, so the first request can take up to a minute.",
};

// "Replace code" in the workspace: new code replaces every stored file.
export const replaceCodeCopy = {
  button: "Replace",
  title: "Upload new code",
  description: (fileCount: number) =>
    `New code replaces all ${fileCount} files. Past reviews, chats and docs stay.`,
};
