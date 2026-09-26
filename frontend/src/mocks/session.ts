// MOCK (frontend-only phase). Replaced by GET /api/auth/me in C1.

export interface SessionUser {
  name: string;
  email: string;
}

export const mockUser: SessionUser = {
  name: "Ashraf Jarabeah",
  email: "ashraf@example.com",
};
