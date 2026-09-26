// MOCK (frontend-only phase). Replaced by real API calls in C1, then this folder is deleted.

export interface AuthResult {
  ok: boolean;
  error?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockSignIn(): Promise<AuthResult> {
  await wait(600);
  return { ok: true };
}

export async function mockRegister(): Promise<AuthResult> {
  await wait(600);
  return { ok: true };
}
