import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["@remotion/renderer", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/mobile-video/render": [
      "./public/remotion-bundles/mobile-video/**/*",
      "./node_modules/@remotion/renderer/**/*",
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/remotion/**/*",
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
    ],
    "/api/mobile-video/render": [
      "./node_modules/@remotion/bundler/**/*",
      "./node_modules/@rspack/**/*",
      "./node_modules/@img/sharp-win32-*/**/*",
      "./node_modules/typescript/**/*",
      "./node_modules/webpack/**/*",
      "./public/banner-themes/**/*",
      "./public/scene-previews/**/*",
      "./public/ffmpeg/**/*",
    ],
  },
};

export default nextConfig;
