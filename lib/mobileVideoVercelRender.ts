import path from "node:path";

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

    const buffer = await sandbox.readFileToBuffer({
      path: sandboxFilePath,
    });

    if (!buffer) {
      throw new Error("Rendered video file was not found in the Vercel Sandbox.");
    }

    return {
      buffer,
      contentType,
      fileName: toSafeMobileVideoFileName(payload.projectName),
    };
  } finally {
    await sandbox.stop().catch(() => undefined);
  }
}
