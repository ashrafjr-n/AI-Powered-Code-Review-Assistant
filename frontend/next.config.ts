import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
