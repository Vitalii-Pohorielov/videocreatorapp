import path from "node:path";

import type { MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";

let bundlePromise: Promise<string> | null = null;

export async function renderMobileVideoToFile(payload: MobileVideoRenderPayload, outputPath: string) {
  const [{ bundle }, { renderMedia, selectComposition }] = await Promise.all([import("@remotion/bundler"), import("@remotion/renderer")]);

  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "root.tsx"),
      onProgress: () => undefined,
      enableCaching: true,
      rootDir: process.cwd(),
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...(config.resolve || {}),
          alias: {
            ...((config.resolve && config.resolve.alias) || {}),
            "@": process.cwd(),
          },
        },
      }),
    });
  }

  const serveUrl = await bundlePromise;
  const composition = await selectComposition({
    serveUrl,
    id: MOBILE_VIDEO_COMPOSITION_ID,
    inputProps: { payload },
  });

  await renderMedia({
    serveUrl,
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
