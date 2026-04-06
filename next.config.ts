import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "hakuhodo-hill.com",
      pathname: "/glpe/photos/scenes-of-meals/**",
    }],
  },
  async headers() {
    return [{
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
      ],
    }];
  },
};
export default nextConfig;
