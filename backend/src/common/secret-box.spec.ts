import { randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret, parseKey } from './secret-box.js';

describe('secret-box', () => {
  const key = randomBytes(32);

  it('round-trips and never stores the plain text', () => {
    const stored = encryptSecret('sk-test-123', key);
    expect(stored).not.toContain('sk-test-123');
    expect(decryptSecret(stored, key)).toBe('sk-test-123');
    // Random IV: same input, different output.
    expect(encryptSecret('sk-test-123', key)).not.toBe(stored);
  });

  it('rejects a changed value or a wrong key', () => {
    const stored = encryptSecret('sk-test-123', key);
    const parts = stored.split('.');
    parts[3] = Buffer.from('sk-evil-999').toString('base64url');
    expect(() => decryptSecret(parts.join('.'), key)).toThrow();
    expect(() => decryptSecret(stored, randomBytes(32))).toThrow();
  });

  it('only accepts a 32-byte hex key', () => {
    expect(parseKey('ab'.repeat(32))).toHaveLength(32);
    expect(() => parseKey('short')).toThrow('64 hex');
  });
});
