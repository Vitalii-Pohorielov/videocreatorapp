import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer"],
  outputFileTracingIncludes: {
    "/api/mobile-video/render": [
      "./app/globals.css",
      "./components/**/*",
      "./lib/**/*",
      "./remotion/**/*",
    ],
  },
};

export default nextConfig;
