import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/ajuda", destination: "/ajuda/index.html" }];
  }
};
export default nextConfig;
