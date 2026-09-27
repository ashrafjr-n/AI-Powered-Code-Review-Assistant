import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Everything the app loads comes from its own origin (fonts are self-hosted by
// next/font, code is highlighted on the server), so 'self' is enough.
// ponytail: 'unsafe-inline' scripts because Next.js inlines its page data; switch to
// per-request nonces (proxy.ts) if a stricter policy is ever needed.
const contentSecurityPolicy = [
  "default-src 'self'",
  // React needs eval only in development (better error stacks).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // No other site may show Redline in a frame (clickjacking).
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Browsers must trust the Content-Type, never guess it.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // frame-ancestors for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework ("X-Powered-By: Next.js").
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    // The repo root also has a package-lock.json (root dev scripts),
    // so tell Turbopack this folder is the app root.
    root: import.meta.dirname,
  },
  // Browser calls to /api/* go to NestJS through this origin, so the login cookie
  // goes with them and no CORS is needed. Used for ZIP uploads, which are too large
  // for Server Actions (1 MB). proxy.ts doesn't match /api, so bodies aren't buffered.
  async rewrites() {
    const backend = process.env.BACKEND_URL;
    if (!backend) throw new Error("BACKEND_URL is not set");
    return [
      {
        source: "/api/:path*",
        destination: `${backend.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
