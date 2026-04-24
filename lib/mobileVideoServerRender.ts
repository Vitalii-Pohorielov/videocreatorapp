import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const REMOTION_TMP_ROOT = path.join(tmpdir(), "video-creator-app", "remotion");
const REMOTION_BROWSER_DOWNLOAD_DIR = path.join(REMOTION_TMP_ROOT, "browser-downloads");
const REMOTION_RENDERER_INTERNALS_DIR = path.join(process.cwd(), "node_modules", "@remotion", "renderer", "dist", "options");

let bundlePromise: Promise<string> | null = null;

type RemotionOptionModule = {
  setConfig: (value: string | null) => void;
};

function ensureRspackBindingAvailable() {
  const runtimeRequire = eval("require") as NodeRequire;

  try {
    runtimeRequire.resolve("@rspack/binding");
    runtimeRequire("@rspack/binding");
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown rspack binding error";
    throw new Error(`Rspack binding preload failed: ${message}`);
  }
}

async function ensureRemotionWritableDirectories() {
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

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function renderMobileVideoToFile(payload: MobileVideoRenderPayload, outputPath: string) {
  await ensureRemotionWritableDirectories();
  ensureRspackBindingAvailable();
  const [{ bundle }, { renderMedia, selectComposition }] = await Promise.all([
    import("@remotion/bundler"),
    import("@remotion/renderer"),
  ]);

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
