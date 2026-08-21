import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const PREBUILT_BUNDLE_DIR = path.join(process.cwd(), "public", "remotion-bundles", "mobile-video");
const PREBUILT_BUNDLE_INDEX = path.join(PREBUILT_BUNDLE_DIR, "index.html");
const REMOTION_TMP_ROOT = path.join(tmpdir(), "video-creator-app", "remotion");
const REMOTION_BROWSER_DOWNLOAD_DIR = path.join(REMOTION_TMP_ROOT, "browser-downloads");
const REMOTION_RENDERER_INTERNALS_DIR = path.join(process.cwd(), "node_modules", "@remotion", "renderer", "dist", "options");

type RemotionOptionModule = {
  setConfig: (value: string | null) => void;
};

async function getBrowserExecutable() {
  const isServerlessLinux = process.platform === "linux" && Boolean(process.env.VERCEL);

  if (!isServerlessLinux) {
    return null;
  }

  const chromiumModule = (await import("@sparticuz/chromium")).default;
  chromiumModule.setGraphicsMode = false;
  return chromiumModule.executablePath();
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function ensureRemotionWritableDirectories() {
  await fs.mkdir(REMOTION_TMP_ROOT, { recursive: true });
  await fs.mkdir(REMOTION_BROWSER_DOWNLOAD_DIR, { recursive: true });

  try {
    const runtimeRequire = eval("require") as (id: string) => unknown;
    const { browserDownloadDirOption } = runtimeRequire(path.join(REMOTION_RENDERER_INTERNALS_DIR, "browser-download-dir.js")) as {
      browserDownloadDirOption?: RemotionOptionModule;
    };

    browserDownloadDirOption?.setConfig(REMOTION_BROWSER_DOWNLOAD_DIR);
  } catch {
    // If Remotion internals change or this file is unavailable in production,
    // we still keep the tmp directory created and let the renderer continue.
  }
}

async function getPrebuiltServeUrl() {
  const hasBundle = await fs
    .stat(PREBUILT_BUNDLE_INDEX)
    .then(() => true)
    .catch(() => false);

  if (!hasBundle) {
    throw new Error("Mobile video prebuilt bundle is missing. Run the build step that generates public/remotion-bundles/mobile-video.");
  }

  return PREBUILT_BUNDLE_DIR;
}

export async function renderMobileVideoToFile(payload: MobileVideoRenderPayload, outputPath: string) {
  await ensureRemotionWritableDirectories();
  const serveUrl = await getPrebuiltServeUrl();
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const browserExecutable = await getBrowserExecutable();

  const composition = await selectComposition({
    serveUrl,
    id: MOBILE_VIDEO_COMPOSITION_ID,
    inputProps: { payload },
    browserExecutable,
    chromiumOptions: {
      gl: null,
      enableMultiProcessOnLinux: false,
    },
    timeoutInMilliseconds: 120000,
    mediaCacheSizeInBytes: 16 * 1024 * 1024,
    offthreadVideoCacheSizeInBytes: 16 * 1024 * 1024,
    offthreadVideoThreads: 1,
  }).catch((error) => {
    throw new Error(`Mobile video composition step failed: ${toErrorMessage(error, "could not select composition")}`);
  });

  await renderMedia({
    serveUrl,
    composition,
    inputProps: { payload },
    codec: "h264",
    outputLocation: outputPath,
    overwrite: true,
    browserExecutable,
    concurrency: 1,
    disallowParallelEncoding: true,
    imageFormat: "jpeg",
    jpegQuality: 95,
    muted: true,
    chromiumOptions: {
      gl: null,
      enableMultiProcessOnLinux: false,
    },
    timeoutInMilliseconds: 180000,
    mediaCacheSizeInBytes: 16 * 1024 * 1024,
    offthreadVideoCacheSizeInBytes: 16 * 1024 * 1024,
    offthreadVideoThreads: 1,
  }).catch((error) => {
    throw new Error(`Mobile video render step failed: ${toErrorMessage(error, "could not render media")}`);
  });
}
