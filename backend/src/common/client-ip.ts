import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';

function sameSecret(given: string, expected: string): boolean {
  // Hash first: timingSafeEqual needs equal lengths, and the hash hides the length.
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * The user's IP. Requests come from the Next.js server (BFF), so req.ip is that server.
 * The BFF sends the browser's IP in X-Client-IP, signed with the shared BFF_SECRET.
 * Without a matching secret (e.g. someone calling this API directly) the header is
 * ignored and req.ip is used (the last proxy hop, see `trust proxy` in main.ts).
 */
export function clientIp(req: Request): string {
  const secret = process.env.BFF_SECRET;
  const given = req.headers['x-bff-secret'];
  const forwarded = req.headers['x-client-ip'];
  if (
    secret &&
    typeof given === 'string' &&
    typeof forwarded === 'string' &&
    isIP(forwarded) &&
    sameSecret(given, secret)
  )
    return forwarded;
  return req.ip ?? 'unknown';
}
