import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly set the workspace root to silence the lockfile warning
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
