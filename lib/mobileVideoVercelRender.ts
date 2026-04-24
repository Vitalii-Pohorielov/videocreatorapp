import path from "node:path";
import { Readable } from "node:stream";

import { addBundleToSandbox, createSandbox, renderMediaOnVercel } from "@remotion/vercel";

import { toSafeMobileVideoFileName, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const BUNDLE_DIR = path.join(process.cwd(), ".remotion-vercel-bundle");

export async function renderMobileVideoOnVercel(payload: MobileVideoRenderPayload) {
  const sandbox = await createSandbox();

  try {
    await addBundleToSandbox({
      sandbox,
      bundleDir: BUNDLE_DIR,
    });

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
