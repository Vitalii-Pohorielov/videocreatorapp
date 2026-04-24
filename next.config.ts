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
      "./node_modules/@rspack/core/**/*",
      "./node_modules/@rspack/binding/**/*",
      "./node_modules/@rspack/binding-linux-x64-gnu/**/*",
      "./node_modules/@rspack/binding-linux-x64-musl/**/*",
      "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
      "./node_modules/@remotion/compositor-linux-x64-musl/**/*",
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
