// No "server-only": the upload drop zone (browser) reads backend errors too.

// NestJS errors look like { message: string | string[] }. Anything else gets a generic text.
export async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body) {
      const { message } = body;
      if (Array.isArray(message) && typeof message[0] === "string")
        return message[0];
      if (typeof message === "string") return message;
    }
  } catch {
    // Not JSON (e.g. a proxy error page): fall through to the generic message.
  }
  return `Request failed (${response.status})`;
}
