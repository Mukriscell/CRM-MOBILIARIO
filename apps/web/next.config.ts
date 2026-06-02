import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@clientra/shared-types", "@clientra/shared-utils"],
};

export default nextConfig;
