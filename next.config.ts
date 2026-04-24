import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["@remotion/renderer", "webpack", "source-map"],
  outputFileTracingIncludes: {
    "/api/mobile-video/render": [
      "./app/globals.css",
      "./components/**/*",
      "./lib/**/*",
      "./remotion/**/*",
      "./node_modules/@remotion/bundler/dist/**/*",
      "./node_modules/@remotion/bundler/css-loader/**/*",
      "./node_modules/@remotion/bundler/react-shim.js",
      "./node_modules/@remotion/bundler/favicon.ico",
      "./node_modules/@remotion/studio/dist/renderEntry.js",
      "./node_modules/@remotion/studio/dist/esm/renderEntry.mjs",
      "./node_modules/webpack/**/*",
      "./node_modules/source-map/**/*",
      "./node_modules/react/**/*",
      "./node_modules/react-dom/**/*",
      "./node_modules/remotion/**/*",
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
