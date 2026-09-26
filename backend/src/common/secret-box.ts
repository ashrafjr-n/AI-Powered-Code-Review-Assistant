import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM: encrypts AND detects tampering (the auth tag).
// Stored as "v1.<iv>.<tag>.<ciphertext>" (base64url), so the format can change later.

/** ENCRYPTION_KEY = 64 hex characters (32 bytes). Make one with: openssl rand -hex 32 */
export function parseKey(hex: string): Buffer {
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32)
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  return key;
}

export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(12); // new random IV every time: never reuse one with GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv, cipher.getAuthTag(), data]
    .map((part) =>
      typeof part === 'string' ? part : part.toString('base64url'),
    )
    .join('.');
}

/** Throws if the value was changed or the key is wrong. */
export function decryptSecret(stored: string, key: Buffer): string {
  const [version, iv, tag, data] = stored.split('.');
  if (version !== 'v1' || !iv || !tag || data === undefined)
    throw new Error('Unknown secret format');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(data, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
