// Upload rules shared by the drop zone (UX) and the server (security).
export const MAX_ZIP_BYTES = 10 * 1024 * 1024;

export function zipProblem(name: string, size: number): string | null {
  if (!name.toLowerCase().endsWith(".zip")) return "Choose a .zip file.";
  if (size === 0) return "This ZIP file is empty.";
  if (size > MAX_ZIP_BYTES) return "The ZIP is larger than 10 MB.";
  return null;
}
