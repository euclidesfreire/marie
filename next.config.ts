import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logodownload.org",
        pathname: "/wp-content/uploads/**"
      }
    ]
  }
};

export default nextConfig;
