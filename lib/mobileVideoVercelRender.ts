import path from "node:path";

import { renderMedia, selectComposition } from "@remotion/renderer";

import type { MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const PREBUILT_BUNDLE_DIR = path.join(process.cwd(), ".remotion-vercel-bundle");

export async function renderMobileVideoToFile(payload: MobileVideoRenderPayload, outputPath: string) {
  const composition = await selectComposition({
    serveUrl: PREBUILT_BUNDLE_DIR,
    id: MOBILE_VIDEO_COMPOSITION_ID,
    inputProps: { payload },
  });

  await renderMedia({
    serveUrl: PREBUILT_BUNDLE_DIR,
    composition,
    inputProps: { payload },
    codec: "h264",
    outputLocation: outputPath,
    overwrite: true,
    imageFormat: "jpeg",
    jpegQuality: 95,
    muted: true,
    chromiumOptions: {
      gl: "swiftshader",
    },
  });
}
