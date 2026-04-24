import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { renderMedia, selectComposition } from "@remotion/renderer";

import type { MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const PREBUILT_BUNDLE_DIR = path.join(process.cwd(), ".remotion-vercel-bundle");
const REMOTION_TMP_ROOT = path.join(tmpdir(), "video-creator-app", "remotion");
const REMOTION_BROWSER_DOWNLOAD_DIR = path.join(REMOTION_TMP_ROOT, "browser-downloads");
const REMOTION_RENDERER_INTERNALS_DIR = path.join(process.cwd(), "node_modules", "@remotion", "renderer", "dist", "options");
const runtimeRequire = eval("require") as (id: string) => unknown;

type RemotionOptionModule = {
  setConfig: (value: string | null) => void;
};

const { browserDownloadDirOption } = runtimeRequire(path.join(REMOTION_RENDERER_INTERNALS_DIR, "browser-download-dir.js")) as {
  browserDownloadDirOption: RemotionOptionModule;
};

async function ensureRemotionWritableDirectories() {
  await fs.mkdir(REMOTION_BROWSER_DOWNLOAD_DIR, { recursive: true });

  browserDownloadDirOption.setConfig(REMOTION_BROWSER_DOWNLOAD_DIR);
}

export async function renderMobileVideoToFile(payload: MobileVideoRenderPayload, outputPath: string) {
  await ensureRemotionWritableDirectories();

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
