import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingIncludes: {
    "/api/mobile-video/render": [
      "./scripts/render-mobile-video.cjs",
      "./remotion/**/*",
      "./node_modules/@remotion/bundler/**/*",
      "./node_modules/@remotion/renderer/**/*",
      "./node_modules/remotion/**/*",
    ],
  },
};

export default nextConfig;
