import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import { renderMediaOnVercel } from "@remotion/vercel";
import { Sandbox } from "@vercel/sandbox";

import { toSafeMobileVideoFileName, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const SNAPSHOT_FILE = path.join(process.cwd(), ".remotion-vercel-snapshot.json");

async function restoreSandboxSnapshot() {
  const file = await fs.readFile(SNAPSHOT_FILE, "utf8").catch(() => null);

  if (!file) {
    throw new Error("No Remotion sandbox snapshot was bundled with this deployment. Redeploy the app to rebuild it.");
  }

  const payload = JSON.parse(file) as { snapshotId?: string };

  if (!payload.snapshotId) {
    throw new Error("The bundled Remotion sandbox snapshot is invalid. Redeploy the app to refresh it.");
  }

  return Sandbox.create({
    source: {
      type: "snapshot",
      snapshotId: payload.snapshotId,
    },
  });
}

export async function renderMobileVideoOnVercel(payload: MobileVideoRenderPayload) {
  const sandbox = await restoreSandboxSnapshot();

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

    const stream = await sandbox.readFile({
      path: sandboxFilePath,
    });

    if (!stream) {
      throw new Error("Rendered video file was not found in the Vercel Sandbox.");
    }

    let cleanedUp = false;
    const cleanup = async () => {
      if (cleanedUp) return;
      cleanedUp = true;
      await sandbox.stop().catch(() => undefined);
    };

    stream.once("end", () => {
      void cleanup();
    });

    stream.once("close", () => {
      void cleanup();
    });

    stream.once("error", () => {
      void cleanup();
    });

    return {
      stream: Readable.toWeb(stream as Readable) as unknown as ReadableStream<Uint8Array>,
      contentType,
      fileName: toSafeMobileVideoFileName(payload.projectName),
    };
  } catch (error) {
    await sandbox.stop().catch(() => undefined);
    throw error;
  }
}
