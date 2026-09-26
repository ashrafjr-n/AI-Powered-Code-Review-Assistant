"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendUrl } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/error-message";
import { AUTH_COOKIE } from "@/lib/auth-cookie";
import { safeNextPath } from "@/lib/safe-redirect";

export interface AuthFormState {
  email: string;
  name?: string;
  error?: string;
}

// The backend signs the JWT and answers with Set-Cookie. We copy that token into a cookie
// on the frontend's own domain, so the browser only ever talks to one origin.
async function startSession(response: Response): Promise<void> {
  const header = response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE}=`));
  const token = header?.split(";")[0].slice(AUTH_COOKIE.length + 1);
  if (!token) throw new Error("The backend did not start a session");
  const maxAge = Number(/Max-Age=(\d+)/i.exec(header ?? "")?.[1]) || undefined;

  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true, // browser JavaScript can't read it
    sameSite: "lax", // not sent on cross-site POSTs (CSRF)
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

async function callAuth(
  path: "login" | "register",
  body: Record<string, string>,
) {
  try {
    return await fetch(`${backendUrl()}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return null; // backend down or unreachable
  }
}

async function friendlyError(response: Response | null): Promise<string> {
  if (!response) return "Can't reach the server. Please try again in a moment.";
  if (response.status === 401) return "Invalid email or password.";
  if (response.status === 409)
    return "This email is already registered. Try signing in.";
  if (response.status === 429)
    return "Too many attempts. Wait a minute and try again.";
  if (response.status === 400) return errorMessage(response);
  return "Something went wrong. Please try again.";
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const response = await callAuth("login", {
    email,
    password: String(formData.get("password") ?? ""),
  });
  if (!response?.ok) return { email, error: await friendlyError(response) };

  await startSession(response);
  redirect(safeNextPath(formData.get("next")));
}

export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const response = await callAuth("register", {
    name,
    email,
    password: String(formData.get("password") ?? ""),
  });
  if (!response?.ok)
    return { name, email, error: await friendlyError(response) };

  await startSession(response);
  redirect("/projects");
}

// The JWT is stateless, so signing out = deleting the cookie (see brain: known trade-off).
export async function logoutAction(): Promise<void> {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}
