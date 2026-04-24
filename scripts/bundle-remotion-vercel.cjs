const fs = require("node:fs/promises");
const path = require("node:path");

const { bundle } = require("@remotion/bundler");

const BUNDLE_DIR = path.join(process.cwd(), ".remotion-vercel-bundle");

const webpackOverride = (config) => ({
  ...config,
  resolve: {
    ...(config.resolve || {}),
    alias: {
      ...((config.resolve && config.resolve.alias) || {}),
      "@": process.cwd(),
    },
  },
});

async function main() {
  await fs.rm(BUNDLE_DIR, { recursive: true, force: true });

  console.log("[mobile-video bundle] Bundling Remotion project for Vercel Sandbox...");
  await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "root.tsx"),
    outDir: BUNDLE_DIR,
    onProgress: () => undefined,
    enableCaching: true,
    rootDir: process.cwd(),
    webpackOverride,
  });

  console.log(`[mobile-video bundle] Bundle written to ${BUNDLE_DIR}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
