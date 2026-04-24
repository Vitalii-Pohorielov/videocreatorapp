const fs = require("node:fs/promises");
const path = require("node:path");

const { bundle } = require("@remotion/bundler");

const BUNDLE_DIR = path.join(process.cwd(), ".remotion-vercel-bundle");
const SNAPSHOT_FILE = path.join(process.cwd(), ".remotion-vercel-snapshot.json");

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
  if (!process.env.VERCEL) {
    console.log("[mobile-video snapshot] Skipping snapshot creation outside Vercel.");
    return;
  }

  const { addBundleToSandbox, createSandbox } = await import("@remotion/vercel");

  await fs.rm(BUNDLE_DIR, { recursive: true, force: true });

  console.log("[mobile-video snapshot] Bundling Remotion project...");
  await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "root.tsx"),
    outDir: BUNDLE_DIR,
    onProgress: () => undefined,
    enableCaching: true,
    rootDir: process.cwd(),
    webpackOverride,
  });

  console.log("[mobile-video snapshot] Creating Vercel sandbox...");
  const sandbox = await createSandbox({
    onProgress: ({ progress, message }) => {
      const pct = Math.round(progress * 100);
      console.log(`[mobile-video snapshot] ${message} (${pct}%)`);
    },
  });

  try {
    console.log("[mobile-video snapshot] Uploading bundle to sandbox...");
    await addBundleToSandbox({
      sandbox,
      bundleDir: BUNDLE_DIR,
    });

    console.log("[mobile-video snapshot] Taking sandbox snapshot...");
    const snapshot = await sandbox.snapshot({ expiration: 0 });

    await fs.writeFile(
      SNAPSHOT_FILE,
      JSON.stringify({ snapshotId: snapshot.snapshotId }, null, 2),
      "utf8",
    );

    console.log(`[mobile-video snapshot] Snapshot saved locally: ${snapshot.snapshotId}`);
  } finally {
    await sandbox.stop().catch(() => undefined);
    await fs.rm(BUNDLE_DIR, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
