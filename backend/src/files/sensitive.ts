// Privacy rules for uploaded code.
// 1. Sensitive FILES (env files, keys, credentials) are kept by path only: never stored,
//    opened or sent to a model. The frontend applies the same rule before upload
//    (frontend/src/lib/upload.ts), so the content normally never leaves the browser.
// 2. Secrets INSIDE normal files (a hardcoded key) are replaced with ‹redacted› before
//    saving, so a model can still say "hardcoded secret" without ever seeing it.

const SAFE_ENV_TEMPLATES = /^\.env\.(example|sample|template|dist)$/;

const SENSITIVE_NAMES = [
  /^\.env$/,
  /^\.env\..+$/,
  /^\.dev\.vars(\..+)?$/,
  /^\.(npmrc|pypirc|netrc|git-credentials|htpasswd|secrets)$/,
  /^id_(rsa|dsa|ecdsa|ed25519)$/,
  /\.(pem|key|p12|pfx|p8|jks|keystore|tfstate)$/,
  /^terraform\.tfvars$/,
  /^(credentials|client_secrets?)(\..+)?\.json$/,
  /^service-account.*\.json$/,
  /-credentials\.json$/,
  /^firebase-adminsdk.*\.json$/,
  /^secrets?\.(ya?ml|json|toml)$/,
];

export function isSensitivePath(path: string): boolean {
  const name = path.split('/').pop()!.toLowerCase();
  if (SAFE_ENV_TEMPLATES.test(name)) return false;
  return SENSITIVE_NAMES.some((pattern) => pattern.test(name));
}

export const REDACTED = '‹redacted›';

// Well-known key formats. Each match is replaced on its own line, so line numbers stay
// the same (review issues point at the right line).
const SECRET_PATTERNS = [
  /\bsk-(?:proj-|or-v1-|ant-)?[A-Za-z0-9_-]{20,}/g, // OpenAI, OpenRouter, Anthropic
  /\b[sr]k_(?:live|test)_[A-Za-z0-9]{10,}/g, // Stripe
  /\bAIza[0-9A-Za-z_-]{35}\b/g, // Google
  /\bgh[pousr]_[A-Za-z0-9]{30,}/g, // GitHub tokens
  /\bgithub_pat_[A-Za-z0-9_]{22,}/g,
  /\bxox[abposr]-[A-Za-z0-9-]{10,}/g, // Slack
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key id
  /\bgsk_[A-Za-z0-9]{20,}/g, // Groq
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
];
// password = "…", apiKey: '…', CLIENT_SECRET="…" → only the quoted value is replaced.
const ASSIGNED_SECRET =
  /((?:password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key)["']?\s*[:=]\s*["'])([^"'\s]{8,})(["'])/gi;
const PRIVATE_KEY_BLOCK =
  /(-----BEGIN [A-Z ]*PRIVATE KEY-----)([\s\S]*?)(-----END [A-Z ]*PRIVATE KEY-----)/g;

/** Replaces secrets in code. `count` = how many were replaced. */
export function redactSecrets(content: string): {
  content: string;
  count: number;
} {
  let count = 0;
  let result = content.replace(
    PRIVATE_KEY_BLOCK,
    (_match, begin, body, end) => {
      count++;
      // Keep the newlines so the line numbers below don't move.
      const lines = (body as string)
        .split('\n')
        .map((line) => (line.trim() ? REDACTED : line));
      return `${begin}${lines.join('\n')}${end}`;
    },
  );
  for (const pattern of SECRET_PATTERNS)
    result = result.replace(pattern, () => {
      count++;
      return REDACTED;
    });
  result = result.replace(ASSIGNED_SECRET, (match, before, value, after) => {
    if (value === REDACTED) return match;
    count++;
    return `${before}${REDACTED}${after}`;
  });
  return { content: result, count };
}
