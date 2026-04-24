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
      "./node_modules/@rspack/**/*",
    ],
  },
};

export default nextConfig;
