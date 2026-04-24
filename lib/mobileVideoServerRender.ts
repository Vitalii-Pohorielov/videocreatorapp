import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

import type { MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const REMOTION_TMP_ROOT = path.join(tmpdir(), "video-creator-app", "remotion");
const REMOTION_BROWSER_DOWNLOAD_DIR = path.join(REMOTION_TMP_ROOT, "browser-downloads");
const REMOTION_RENDERER_INTERNALS_DIR = path.join(process.cwd(), "node_modules", "@remotion", "renderer", "dist", "options");
const runtimeRequire = eval("require") as (id: string) => unknown;

let bundlePromise: Promise<string> | null = null;

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

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function renderMobileVideoToFile(payload: MobileVideoRenderPayload, outputPath: string) {
  await ensureRemotionWritableDirectories();

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
    }).catch((error) => {
      bundlePromise = null;
      throw new Error(`Mobile video bundle step failed: ${toErrorMessage(error, "unknown bundler error")}`);
    });
  }

  let serveUrl: string;
  try {
    serveUrl = await bundlePromise;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Mobile video bundle step failed."));
  }

  const composition = await selectComposition({
    serveUrl,
    id: MOBILE_VIDEO_COMPOSITION_ID,
    inputProps: { payload },
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
    imageFormat: "jpeg",
    jpegQuality: 95,
    muted: true,
    chromiumOptions: {
      gl: "swiftshader",
      enableMultiProcessOnLinux: false,
    },
  }).catch((error) => {
    throw new Error(`Mobile video render step failed: ${toErrorMessage(error, "could not render media")}`);
  });
}
