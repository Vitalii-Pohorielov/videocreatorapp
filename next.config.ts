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
    "/*": [
      "./node_modules/.remotion/**/*",
      "./node_modules/@rspack/binding-win32-*/**/*",
      "./node_modules/@rspack/binding-darwin-*/**/*",
      "./node_modules/@rspack/binding-linux-arm64-*/**/*",
      "./node_modules/@remotion/compositor-win32-*/**/*",
      "./node_modules/@remotion/compositor-darwin-*/**/*",
      "./node_modules/@remotion/compositor-linux-arm64-*/**/*",
      "./node_modules/@esbuild/win32-*/**/*",
      "./node_modules/@esbuild/darwin-*/**/*",
      "./node_modules/@esbuild/linux-arm64/**/*",
    ],
  },
};

export default nextConfig;
