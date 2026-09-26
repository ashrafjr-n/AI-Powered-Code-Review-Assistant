import { isSensitivePath, REDACTED, redactSecrets } from './sensitive.js';

describe('isSensitivePath', () => {
  it.each([
    '.env',
    'apps/api/.env.local',
    '.env.production',
    '.dev.vars',
    'certs/server.pem',
    'deploy/id_ed25519',
    'config/credentials.json',
    'gcp/service-account-prod.json',
    '.npmrc',
    'infra/terraform.tfvars',
  ])('hides %s', (path) => expect(isSensitivePath(path)).toBe(true));

  it.each([
    '.env.example',
    '.env.sample',
    'src/env.ts',
    'README.md',
    'package.json',
    'src/keys.ts',
  ])('keeps %s', (path) => expect(isSensitivePath(path)).toBe(false));
});

describe('redactSecrets', () => {
  it('replaces known keys and assigned secrets, keeps line numbers', () => {
    const input = [
      'const stripe = "sk_live_51HxQz8ExampleSecretKey";',
      'const openai = "sk-proj-abcdefghijklmnopqrstuvwxyz123456";',
      'const google = "AIzaSyA1234567890abcdefghijklmnopqrstuv";',
      "password: 'hunter2hunter2',",
      'const note = "no secrets here";',
    ].join('\n');
    const { content, count } = redactSecrets(input);
    expect(count).toBe(4);
    expect(content.split('\n')).toEqual([
      `const stripe = "${REDACTED}";`,
      `const openai = "${REDACTED}";`,
      `const google = "${REDACTED}";`,
      `password: '${REDACTED}',`,
      'const note = "no secrets here";',
    ]);
  });

  it('redacts private key blocks without changing the line count', () => {
    const key =
      '-----BEGIN PRIVATE KEY-----\nMIIEv\nQIBADAN\n-----END PRIVATE KEY-----\nnext';
    const { content, count } = redactSecrets(key);
    expect(count).toBe(1);
    expect(content.split('\n')).toHaveLength(5);
    expect(content).not.toContain('MIIEv');
    expect(content.endsWith('next')).toBe(true);
  });
});
