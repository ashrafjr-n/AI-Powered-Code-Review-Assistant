import "server-only";
import { cache } from "react";
import type { SessionUser } from "@/lib/types";
import { apiFetch } from "./client";

// cache(): the layout and the page can both ask for the user, but the backend is called once per request.
export const getCurrentUser = cache(() => apiFetch<SessionUser>("/auth/me"));
