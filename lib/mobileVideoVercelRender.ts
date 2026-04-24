import { get } from "@vercel/blob";
import { renderMediaOnVercel, uploadToVercelBlob } from "@remotion/vercel";
import { Sandbox } from "@vercel/sandbox";

import { toSafeMobileVideoFileName, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const SANDBOX_CREATING_TIMEOUT = 5 * 60 * 1000;

function getSnapshotBlobKey() {
  return `snapshot-cache/mobile-video/${process.env.VERCEL_DEPLOYMENT_ID ?? "local"}.json`;
}

async function restoreSnapshot() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  }

  const blob = await get(getSnapshotBlobKey(), {
    access: "public",
    token: blobToken,
  });

  if (!blob) {
    throw new Error("No mobile video sandbox snapshot found. Redeploy to recreate the Remotion snapshot.");
  }

  const response = new Response(blob.stream);
  const cache = (await response.json()) as { snapshotId?: string };

  if (!cache.snapshotId) {
    throw new Error("The mobile video sandbox snapshot is invalid. Redeploy to refresh it.");
  }

  return Sandbox.create({
    source: { type: "snapshot", snapshotId: cache.snapshotId },
    timeout: SANDBOX_CREATING_TIMEOUT,
  });
}

export async function renderMobileVideoOnVercel(payload: MobileVideoRenderPayload) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  }

  const sandbox = await restoreSnapshot();

  try {
    const { sandboxFilePath, contentType } = await renderMediaOnVercel({
      sandbox,
      compositionId: MOBILE_VIDEO_COMPOSITION_ID,
      inputProps: { payload },
      codec: "h264",
      imageFormat: "jpeg",
      jpegQuality: 95,
      muted: true,
      chromiumOptions: {
        gl: "swiftshader",
      },
    });

    const fileName = toSafeMobileVideoFileName(payload.projectName);
    const { url } = await uploadToVercelBlob({
      sandbox,
      sandboxFilePath,
      contentType,
      blobToken,
      access: "public",
      blobPath: `mobile-video-renders/${crypto.randomUUID()}-${fileName}`,
    });

    return {
      fileName,
      url,
    };
  } finally {
    await sandbox.stop().catch(() => undefined);
  }
}
