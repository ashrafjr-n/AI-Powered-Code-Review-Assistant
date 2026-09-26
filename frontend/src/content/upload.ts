// Shown under the drop zone: what happens to a ZIP, so uploads are predictable.

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
