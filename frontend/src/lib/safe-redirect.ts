// Only allow redirects to our own pages. "//evil.com" or "https://evil.com" would be an
// open redirect: a trusted login link that sends the user to another site after sign-in.
export function safeNextPath(value: unknown, fallback = "/projects"): string {
  if (typeof value !== "string") return fallback;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  )
    return fallback;
  return value;
}
