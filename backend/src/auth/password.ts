import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

// OWASP scrypt option: N=2^14, r=8, p=5 (~16 MB per hash, fits Node's default maxmem).
const PARAMS = { N: 2 ** 14, r: 8, p: 5 };
const KEY_LENGTH = 64;

// Stored as "salt:hash" (hex).
// ponytail: params are fixed, not stored per hash; store them in the string if we ever change them.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, PARAMS);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) {
    return false;
  }
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(
    password,
    Buffer.from(saltHex, 'hex'),
    expected.length,
    PARAMS,
  );
  // Constant-time compare: the time taken doesn't reveal how many bytes matched.
  return timingSafeEqual(actual, expected);
}
