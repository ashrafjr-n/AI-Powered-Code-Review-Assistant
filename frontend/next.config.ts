import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // The repo root also has a package-lock.json (root dev scripts),
    // so tell Turbopack this folder is the app root.
    root: import.meta.dirname,
  },
};

export default nextConfig;
