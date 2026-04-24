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
      "./node_modules/@img/sharp-win32-*/**/*",
      "./node_modules/@img/sharp-darwin-*/**/*",
      "./node_modules/@img/sharp-linux-arm64/**/*",
    ],
  },
};

export default nextConfig;
