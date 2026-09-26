// No "server-only": the upload drop zone (browser) reads backend errors too.

export interface BackendError {
  message: string;
  /** Machine-readable reason, e.g. "DEMO_LIMIT" or "DEMO_BUSY". */
  code?: string;
  /** DEMO_LIMIT only: when the daily counts go back to zero (ISO date). */
  resetsAt?: string;
}

// NestJS errors look like { message: string | string[], code?, resetsAt? }.
// Anything else gets a generic text.
export async function readError(response: Response): Promise<BackendError> {
  const fallback = { message: `Request failed (${response.status})` };
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("message" in body))
      return fallback;
    const { message } = body;
    const text =
      Array.isArray(message) && typeof message[0] === "string"
        ? message[0]
        : typeof message === "string"
          ? message
          : fallback.message;
    const code =
      "code" in body && typeof body.code === "string" ? body.code : undefined;
    const resetsAt =
      "resetsAt" in body && typeof body.resetsAt === "string"
        ? body.resetsAt
        : undefined;
    return { message: text, code, resetsAt };
  } catch {
    // Not JSON (e.g. a proxy error page).
    return fallback;
  }
}

export async function errorMessage(response: Response): Promise<string> {
  return (await readError(response)).message;
}
