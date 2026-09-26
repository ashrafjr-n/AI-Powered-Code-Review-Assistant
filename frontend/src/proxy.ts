import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-cookie";

// Optimistic check only: "is there a session cookie?". The backend still verifies the
// token on every API call, so a fake cookie gets a 401 and is sent back to /login.
export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const hasSession = request.cookies.has(AUTH_COOKIE);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!hasSession && !isAuthPage) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  // Signed in → skip the forms. "expired" means the cookie exists but the backend rejected it.
  if (hasSession && isAuthPage && !searchParams.has("expired")) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/projects/:path*",
    "/reviews/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
