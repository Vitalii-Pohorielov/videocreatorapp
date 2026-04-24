import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingIncludes: {
    "/api/mobile-video/render": [
      "./.remotion-vercel-bundle/**/*",
    ],
  },
};

export default nextConfig;
