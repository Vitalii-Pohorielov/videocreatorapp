import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["@remotion/renderer"],
  outputFileTracingIncludes: {
    "/api/mobile-video/render": [
      "./.remotion-vercel-bundle/**/*",
    ],
  },
  outputFileTracingExcludes: {
    "/*": [
      "./node_modules/.remotion/**/*",
      "./node_modules/@remotion/compositor-win32-*/**/*",
      "./node_modules/@remotion/compositor-darwin-*/**/*",
      "./node_modules/@remotion/compositor-linux-arm64-*/**/*",
    ],
  },
};

export default nextConfig;
