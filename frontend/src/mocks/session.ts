// MOCK (frontend-only phase). Replaced by GET /api/auth/me in C1.
import type { SessionUser } from "@/lib/types";

export const mockUser: SessionUser = {
  name: "Ashraf Jarabeah",
  email: "ashraf@example.com",
};
