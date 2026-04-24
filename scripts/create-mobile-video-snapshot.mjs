import { execFileSync } from "node:child_process";
import path from "node:path";

import { put } from "@vercel/blob";
import { addBundleToSandbox, createSandbox } from "@remotion/vercel";

function getSnapshotBlobKey() {
  return `snapshot-cache/${process.env.VERCEL_DEPLOYMENT_ID ?? "local"}.json`;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[mobile-video snapshot] Skipping snapshot creation because BLOB_READ_WRITE_TOKEN is not set.");
    return;
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
