const fs = require("node:fs/promises");
const path = require("node:path");

const { bundle } = require("@remotion/bundler");
const { put } = require("@vercel/blob");

const BUNDLE_DIR = path.join(process.cwd(), ".remotion-vercel-bundle");
const SNAPSHOT_BLOB_KEY = `snapshot-cache/mobile-video/${process.env.VERCEL_DEPLOYMENT_ID ?? "local"}.json`;

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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
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
    await addBundleToSandbox({ sandbox, bundleDir: BUNDLE_DIR });

    console.log("[mobile-video snapshot] Taking sandbox snapshot...");
    const snapshot = await sandbox.snapshot({ expiration: 0 });

    await put(
      SNAPSHOT_BLOB_KEY,
      JSON.stringify({ snapshotId: snapshot.snapshotId }),
      {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      },
    );

    console.log(`[mobile-video snapshot] Snapshot saved: ${snapshot.snapshotId}`);
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
