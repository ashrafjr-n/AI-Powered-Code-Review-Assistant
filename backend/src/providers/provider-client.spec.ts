import { assertSafeBaseUrl, ProviderError } from './provider-client.js';

describe('assertSafeBaseUrl', () => {
  const blocked = [
    'http://127.0.0.1:1234/v1',
    'http://localhost:11434/v1',
    'http://169.254.169.254/latest',
    'http://10.0.0.5/v1',
    'http://[::1]:8080/v1',
    'http://[::ffff:127.0.0.1]/v1',
  ];

  it.each(blocked)('blocks %s on a hosted server', async (url) => {
    await expect(assertSafeBaseUrl(url, false)).rejects.toThrow(
      'private network',
    );
  });

  it('allows public addresses, and local ones when allowed', async () => {
    await expect(
      assertSafeBaseUrl('https://8.8.8.8/v1', false),
    ).resolves.toBeUndefined();
    await expect(
      assertSafeBaseUrl('http://localhost:1234/v1', true),
    ).resolves.toBeUndefined();
  });

  it('only accepts http(s) URLs', async () => {
    await expect(assertSafeBaseUrl('file:///etc/passwd', true)).rejects.toThrow(
      ProviderError,
    );
    await expect(assertSafeBaseUrl('not a url', true)).rejects.toThrow(
      'not a valid URL',
    );
  });
});
