const { execFileSync } = require("node:child_process");
const path = require("node:path");

const { put } = require("@vercel/blob");
const { addBundleToSandbox, createSandbox } = require("@remotion/vercel");

function getSnapshotBlobKey() {
  return `snapshot-cache/${process.env.VERCEL_DEPLOYMENT_ID ?? "local"}.json`;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required to create the mobile video sandbox snapshot.");
  }

  execFileSync(process.execPath, [path.join(process.cwd(), "scripts", "bundle-remotion-vercel.cjs")], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  const sandbox = await createSandbox({
    onProgress: ({ progress, message }) => {
      const percent = Math.round(progress * 100);
      console.log(`[mobile-video snapshot] ${message} (${percent}%)`);
    },
  });

  try {
    console.log("[mobile-video snapshot] Uploading Remotion bundle to sandbox...");
    await addBundleToSandbox({
      sandbox,
      bundleDir: ".remotion-vercel-bundle",
    });

    console.log("[mobile-video snapshot] Creating snapshot...");
    const snapshot = await sandbox.snapshot({ expiration: 0 });

    await put(getSnapshotBlobKey(), JSON.stringify({ snapshotId: snapshot.snapshotId }), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`[mobile-video snapshot] Snapshot saved: ${snapshot.snapshotId}`);
  } finally {
    await sandbox.stop().catch(() => undefined);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
