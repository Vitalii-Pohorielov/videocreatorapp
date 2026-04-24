import { get } from "@vercel/blob";
import { Sandbox } from "@vercel/sandbox";

const SANDBOX_CREATING_TIMEOUT = 5 * 60 * 1000;

function getSnapshotBlobKey() {
  return `snapshot-cache/${process.env.VERCEL_DEPLOYMENT_ID ?? "local"}.json`;
}

export async function restoreSnapshot(blobToken: string) {
  const blob = await get(getSnapshotBlobKey(), {
    access: "public",
    token: blobToken,
  });

  if (!blob) {
    throw new Error("No mobile video sandbox snapshot found for this deployment.");
  }

  const response = new Response(blob.stream);
  const cache = (await response.json()) as { snapshotId?: string };

  if (!cache.snapshotId) {
    throw new Error("Snapshot metadata is missing a snapshotId.");
  }

  return Sandbox.create({
    source: {
      type: "snapshot",
      snapshotId: cache.snapshotId,
    },
    timeout: SANDBOX_CREATING_TIMEOUT,
  });
}
