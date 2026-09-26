// Files that usually hold secrets. Same rule as the backend
// (backend/src/files/sensitive.ts, the real check): the browser uploads them EMPTY,
// so their content never leaves the user's computer.

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
  const name = (path.split("/").pop() ?? "").toLowerCase();
  if (SAFE_ENV_TEMPLATES.test(name)) return false;
  return SENSITIVE_NAMES.some((pattern) => pattern.test(name));
}
