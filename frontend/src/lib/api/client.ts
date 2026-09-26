import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/auth-cookie";

// Runs only on the Next.js server. The browser never sees BACKEND_URL or the raw token.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function backendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) throw new Error("BACKEND_URL is not set");
  return url.replace(/\/+$/, "");
}

// NestJS errors look like { message: string | string[] }. Anything else gets a generic text.
export async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body) {
      const { message } = body;
      if (Array.isArray(message) && typeof message[0] === "string")
        return message[0];
      if (typeof message === "string") return message;
    }
  } catch {
    // Not JSON (e.g. a proxy error page): fall through to the generic message.
  }
  return `Request failed (${response.status})`;
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
      ...(token ? { Cookie: `${AUTH_COOKIE}=${token}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401) redirect("/login?expired=1");
  if (!response.ok)
    throw new ApiError(response.status, await errorMessage(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
