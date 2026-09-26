import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/auth-cookie";
import { readError, type BackendError } from "./error-message";

// Runs only on the Next.js server. The browser never sees BACKEND_URL or the raw token.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Extra fields from the backend, e.g. code "DEMO_LIMIT". */
    public readonly details: Omit<BackendError, "message"> = {},
  ) {
    super(message);
  }
}

export function backendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) throw new Error("BACKEND_URL is not set");
  return url.replace(/\/+$/, "");
}

/**
 * The browser's IP, signed with the secret shared with the backend. Every call reaches the
 * backend from this server, so without it rate limits would count this server, not users.
 * Vercel sets x-real-ip / x-forwarded-for itself, so browsers can't fake them.
 */
export async function clientIpHeaders(): Promise<Record<string, string>> {
  const secret = process.env.BFF_SECRET;
  const all = await headers();
  const ip =
    all.get("x-real-ip") ?? all.get("x-forwarded-for")?.split(",")[0]?.trim();
  return secret && ip ? { "X-Client-IP": ip, "X-BFF-Secret": secret } : {};
}

/**
 * Calls the backend as the signed-in user (forwards the login cookie).
 * A 401 means the session is gone or expired → back to the login page.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const response = await fetch(`${backendUrl()}/api${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(await clientIpHeaders()),
      ...(token ? { Cookie: `${AUTH_COOKIE}=${token}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401) redirect("/login?expired=1");
  if (!response.ok) {
    const { message, ...details } = await readError(response);
    throw new ApiError(response.status, message, details);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
