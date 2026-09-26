// No "server-only": the upload drop zone (browser) reads backend errors too.

export interface BackendError {
  message: string;
  /** Machine-readable reason, e.g. "DEMO_LIMIT" or "DEMO_BUSY". */
  code?: string;
  /** DEMO_LIMIT only: "user" (this account) or "site" (everyone). */
  reason?: string;
  /** DEMO_LIMIT only: when the daily counts go back to zero (ISO date). */
  resetsAt?: string;
}

function optionalString(body: object, key: string): string | undefined {
  const value: unknown = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

// NestJS errors look like { message: string | string[], code?, reason?, resetsAt? }.
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
    return {
      message: text,
      code: optionalString(body, "code"),
      reason: optionalString(body, "reason"),
      resetsAt: optionalString(body, "resetsAt"),
    };
  } catch {
    // Not JSON (e.g. a proxy error page).
    return fallback;
  }
}

export async function errorMessage(response: Response): Promise<string> {
  return (await readError(response)).message;
}
