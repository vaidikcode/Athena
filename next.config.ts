import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
 transpilePackages: ["ai", "@ai-sdk/react"],
};

export default nextConfig;
