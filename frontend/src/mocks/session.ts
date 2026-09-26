// MOCK (frontend-only phase). Replaced by GET /api/auth/me and the providers API in C1/C4.

export interface SessionUser {
  name: string;
  email: string;
}

export interface ActiveProvider {
  name: string;
  model: string;
  location: "Local" | "Cloud";
}

export const mockUser: SessionUser = {
  name: "Ashraf Jarabeah",
  email: "ashraf@example.com",
};

export const mockActiveProvider: ActiveProvider | null = {
  name: "LM Studio",
  model: "qwen2.5-coder-14b",
  location: "Local",
};
