import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import OpenAI from 'openai';

// Loopback, private, link-local (incl. cloud metadata 169.254.169.254), CGNAT, multicast.
// BlockList also matches IPv4-mapped IPv6 like ::ffff:127.0.0.1.
const privateRanges = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['224.0.0.0', 3],
] as const)
  privateRanges.addSubnet(net, prefix, 'ipv4');
for (const [net, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const)
  privateRanges.addSubnet(net, prefix, 'ipv6');

/** The message is safe to show to the user. */
export class ProviderError extends Error {}

/**
 * SSRF guard: the backend calls URLs that users type in. On a hosted server that must
 * not reach its own network (databases, cloud metadata). Local dev sets
 * ALLOW_LOCAL_PROVIDERS=true so LM Studio / Ollama on localhost work.
 */
export async function assertSafeBaseUrl(
  baseUrl: string,
  allowLocal: boolean,
): Promise<void> {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new ProviderError('Base URL is not a valid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new ProviderError('Base URL must start with http:// or https://.');
  if (allowLocal) return;

  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host)
    ? [{ address: host, family: isIP(host) }]
    : await lookup(host, { all: true }).catch(() => {
        throw new ProviderError(`Can't find the host "${host}".`);
      });
  // ponytail: DNS can change between this check and the request (rebinding);
  // pin the checked IP with a custom undici dispatcher if that ever matters.
  if (
    addresses.some(({ address, family }) =>
      privateRanges.check(address, family === 6 ? 'ipv6' : 'ipv4'),
    )
  )
    throw new ProviderError(
      "This server can't reach local or private addresses (like localhost). For a model on your own computer, give it a public https address with a secure tunnel (for example Cloudflare Tunnel or ngrok), or run Redline yourself.",
    );
}

/** One OpenAI-compatible client for OpenAI, OpenRouter, LM Studio, Ollama… */
export function providerClient(
  baseUrl: string,
  apiKey: string | null,
  timeoutMs: number,
): OpenAI {
  return new OpenAI({
    baseURL: baseUrl,
    // Always explicit: otherwise the SDK would fall back to the server's OPENAI_API_KEY
    // env and send it to a URL the user chose. Local servers ignore the key.
    apiKey: apiKey ?? 'not-needed',
    timeout: timeoutMs,
    maxRetries: 0,
    // A redirect could point at a private address the guard never checked.
    fetchOptions: { redirect: 'error' },
  });
}

/** Turns SDK/network errors into a short sentence for the user. */
export function describeProviderError(error: unknown): string {
  if (error instanceof ProviderError) return error.message;
  if (error instanceof OpenAI.APIConnectionTimeoutError)
    return 'The provider did not answer in time.';
  if (error instanceof OpenAI.APIConnectionError)
    return "Can't reach the provider. Is the server running and the URL right?";
  if (error instanceof OpenAI.AuthenticationError)
    return 'The provider rejected the API key.';
  if (error instanceof OpenAI.PermissionDeniedError)
    return 'This API key has no access to that resource.';
  if (error instanceof OpenAI.NotFoundError)
    return 'Not found. Check the base URL (it usually ends with /v1) and the model name.';
  if (error instanceof OpenAI.RateLimitError)
    return 'The provider is rate-limiting requests. Wait a moment and try again.';
  if (error instanceof OpenAI.APIError)
    return `The provider returned an error (${error.status ?? 'unknown'}).`;
  return 'Something went wrong while calling the provider.';
}
