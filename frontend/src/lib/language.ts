// File extension → Shiki language id. Unknown files are shown as plain text.
const byExtension: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  md: "markdown",
  css: "css",
  scss: "scss",
  html: "html",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  rb: "ruby",
  php: "php",
  c: "c",
  h: "c",
  cpp: "cpp",
  cs: "csharp",
  sql: "sql",
  sh: "shellscript",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  prisma: "prisma",
  vue: "vue",
  svelte: "svelte",
  xml: "xml",
};

export function languageFor(path: string): string {
  const name = path.split("/").pop() ?? "";
  if (name === "Dockerfile") return "docker";
  const extension = name.includes(".")
    ? name.split(".").pop()!.toLowerCase()
    : "";
  return byExtension[extension] ?? "text";
}
