import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse');
    expect(stored).not.toContain('correct horse');
    expect(await verifyPassword('correct horse', stored)).toBe(true);
    expect(await verifyPassword('wrong horse', stored)).toBe(false);
  });

  it('uses a random salt, so the same password gives different hashes', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('returns false for a malformed stored value', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
  });
});
