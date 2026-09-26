import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth-cookie";
import type { SessionUser } from "@/lib/types";
import { apiFetch, backendUrl } from "./client";

// cache(): the layout and the page can both ask for the user, but the backend is called once per request.
export const getCurrentUser = cache(() => apiFetch<SessionUser>("/auth/me"));

/**
 * For public pages (the landing header): the signed-in user, or null.
 * Unlike getCurrentUser it never redirects, and a backend that is down just means "signed out".
 */
export const getOptionalUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const response = await fetch(`${backendUrl()}/api/auth/me`, {
    cache: "no-store",
    headers: { Cookie: `${AUTH_COOKIE}=${token}` },
  }).catch(() => null);
  return response?.ok ? ((await response.json()) as SessionUser) : null;
});
