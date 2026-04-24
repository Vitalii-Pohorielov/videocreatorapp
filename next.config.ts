import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "@rspack/core", "@rspack/binding"],
  outputFileTracingIncludes: {
    "/api/mobile-video/render": [
      "./app/globals.css",
      "./components/**/*",
      "./lib/**/*",
      "./remotion/**/*",
    ],
  },
  outputFileTracingExcludes: {
    "/api/mobile-video/render": [
      "./node_modules/.remotion/**/*",
      "./node_modules/@rspack/binding-win32-*/**/*",
      "./node_modules/@remotion/compositor-win32-*/**/*",
    ],
  },
};

export default nextConfig;
