import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type webpack from "webpack";
import { SOURCE_MAP_ENDPOINT, getProjectName } from "@remotion/studio-shared";
import type { MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";
const REMOTION_TMP_ROOT = path.join(tmpdir(), "video-creator-app", "remotion");
const REMOTION_BROWSER_DOWNLOAD_DIR = path.join(REMOTION_TMP_ROOT, "browser-downloads");
const REMOTION_RENDERER_INTERNALS_DIR = path.join(process.cwd(), "node_modules", "@remotion", "renderer", "dist", "options");
const REMOTION_BUNDLER_DIR = path.join(process.cwd(), "node_modules", "@remotion", "bundler");
const REMOTION_BUNDLER_DIST_DIR = path.join(REMOTION_BUNDLER_DIR, "dist");
const REMOTION_STUDIO_DIR = path.join(process.cwd(), "node_modules", "@remotion", "studio");
const REMOTION_ENTRY = path.join(REMOTION_STUDIO_DIR, "dist", "esm", "renderEntry.mjs");
const REMOTION_BUNDLE_DIR = path.join(REMOTION_TMP_ROOT, "bundles", "mobile-video");
const REMOTION_MINIMAL_PUBLIC_DIR = path.join(REMOTION_TMP_ROOT, "public-mobile-video");
const MOBILE_VIDEO_PUBLIC_ASSETS = ["scene-assets/announcement-backgrounds/announcement-hero-bg.mp4"] as const;

let bundlePromise: Promise<string> | null = null;

type RemotionOptionModule = {
  setConfig: (value: string | null) => void;
};

type WebpackOnlyModules = {
  copyDir: (options: {
    src: string;
    dest: string;
    onSymlinkDetected: (entry: unknown, src: string) => void;
    onProgress: (progress: number) => void;
    copiedBytes: number;
    lastReportedProgress: number;
  }) => Promise<number>;
  indexHtml: (options: Record<string, unknown>) => string;
  readRecursively: (options: {
    folder: string;
    output?: Array<{
      name: string;
      lastModified: number;
      sizeInBytes: number;
      src: string;
    }>;
    startPath: string;
    staticHash: string;
    limit: number;
  }) => Array<{
    name: string;
    lastModified: number;
    sizeInBytes: number;
    src: string;
  }>;
  webpackConfig: (options: {
    entry: string;
    userDefinedComponent: string;
    outDir: string | null;
    environment: "development" | "production";
    webpackOverride: (config: webpack.Configuration) => webpack.Configuration;
    onProgress?: (progress: number) => void;
    enableCaching?: boolean;
    maxTimelineTracks: number | null;
    remotionRoot: string;
    keyboardShortcutsEnabled: boolean;
    bufferStateDelayInMilliseconds: number | null;
    poll: number | null;
    askAIEnabled: boolean;
    experimentalClientSideRenderingEnabled: boolean;
    experimentalVisualModeEnabled: boolean;
    extraPlugins: webpack.WebpackPluginInstance[];
  }) => Promise<[string, webpack.Configuration]>;
};

async function ensureRemotionWritableDirectories() {
  await fs.mkdir(REMOTION_BROWSER_DOWNLOAD_DIR, { recursive: true });
  await fs.mkdir(REMOTION_BUNDLE_DIR, { recursive: true });
  await fs.mkdir(REMOTION_MINIMAL_PUBLIC_DIR, { recursive: true });

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

async function syncMinimalPublicDir() {
  await fs.rm(REMOTION_MINIMAL_PUBLIC_DIR, { recursive: true, force: true });
  await fs.mkdir(REMOTION_MINIMAL_PUBLIC_DIR, { recursive: true });

  await Promise.all(
    MOBILE_VIDEO_PUBLIC_ASSETS.map(async (relativeAssetPath) => {
      const sourcePath = path.join(process.cwd(), "public", relativeAssetPath);
      const destinationPath = path.join(REMOTION_MINIMAL_PUBLIC_DIR, relativeAssetPath);

      const exists = await fs
        .stat(sourcePath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        return;
      }

      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.copyFile(sourcePath, destinationPath);
    }),
  );
}

async function validateEntryPoint(entryPoint: string) {
  const contents = await fs.readFile(entryPoint, "utf8");

  if (!contents.includes("registerRoot")) {
    throw new Error(`Mobile video entry point is invalid: ${entryPoint} does not contain registerRoot().`);
  }
}

function getWebpackOnlyModules(): WebpackOnlyModules {
  const runtimeRequire = eval("require") as NodeRequire;

  return {
    copyDir: (runtimeRequire(path.join(REMOTION_BUNDLER_DIST_DIR, "copy-dir.js")) as { copyDir: WebpackOnlyModules["copyDir"] }).copyDir,
    indexHtml: (runtimeRequire(path.join(REMOTION_BUNDLER_DIST_DIR, "index-html.js")) as { indexHtml: WebpackOnlyModules["indexHtml"] }).indexHtml,
    readRecursively: (runtimeRequire(path.join(REMOTION_BUNDLER_DIST_DIR, "read-recursively.js")) as {
      readRecursively: WebpackOnlyModules["readRecursively"];
    }).readRecursively,
    webpackConfig: (runtimeRequire(path.join(REMOTION_BUNDLER_DIST_DIR, "webpack-config.js")) as {
      webpackConfig: WebpackOnlyModules["webpackConfig"];
    }).webpackConfig,
  };
}

async function bundleMobileVideoWithWebpack(): Promise<string> {
  const runtimeRequire = eval("require") as NodeRequire;
  const webpackModule = runtimeRequire("webpack") as typeof webpack;
  const runWebpack = promisify(webpackModule);
  const { copyDir, indexHtml, readRecursively, webpackConfig } = getWebpackOnlyModules();
  const entryPoint = path.join(process.cwd(), "remotion", "root.tsx");

  await validateEntryPoint(entryPoint);
  await fs.mkdir(REMOTION_BUNDLE_DIR, { recursive: true });

  const currentCwd = process.cwd();
  process.chdir(process.cwd());

  try {
    const publicPath = "/";
    const staticHash = "/public";
    await syncMinimalPublicDir();
    const publicDir = REMOTION_MINIMAL_PUBLIC_DIR;
    const publicOutputDir = path.join(REMOTION_BUNDLE_DIR, "public");

    const [, webpackConfiguration] = await webpackConfig({
      entry: REMOTION_ENTRY,
      userDefinedComponent: entryPoint,
      outDir: REMOTION_BUNDLE_DIR,
      environment: "production",
      onProgress: () => undefined,
      enableCaching: true,
      maxTimelineTracks: null,
      remotionRoot: process.cwd(),
      keyboardShortcutsEnabled: true,
      bufferStateDelayInMilliseconds: null,
      poll: null,
      askAIEnabled: false,
      experimentalClientSideRenderingEnabled: false,
      experimentalVisualModeEnabled: false,
      extraPlugins: [],
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

    const webpackStats = (await runWebpack([webpackConfiguration])) as webpack.Stats;

    if (!webpackStats) {
      throw new Error("Webpack did not return build stats.");
    }

    const { errors } = webpackStats.toJson();

    if (errors && errors.length > 0) {
      throw new Error(errors[0]?.message || "Unknown webpack bundling error.");
    }

    await fs.rm(publicOutputDir, { recursive: true, force: true });

    if (await fs.stat(publicDir).then(() => true).catch(() => false)) {
      await copyDir({
        src: publicDir,
        dest: publicOutputDir,
        onSymlinkDetected: () => undefined,
        onProgress: () => undefined,
        copiedBytes: 0,
        lastReportedProgress: 0,
      });
    }

    const publicFiles = readRecursively({
      folder: ".",
      startPath: publicDir,
      staticHash,
      limit: 10000,
    }).map((file) => ({
      ...file,
      name: file.name.split(path.sep).join("/"),
    }));

    const html = indexHtml({
      staticHash,
      publicPath,
      editorName: null,
      inputProps: null,
      remotionRoot: process.cwd(),
      studioServerCommand: null,
      renderQueue: null,
      completedClientRenders: null,
      numberOfAudioTags: 0,
      publicFiles,
      includeFavicon: true,
      title: "Remotion Bundle",
      renderDefaults: undefined,
      publicFolderExists: "/public",
      gitSource: null,
      projectName: getProjectName({
        gitSource: null,
        resolvedRemotionRoot: process.cwd(),
        basename: path.basename,
      }),
      installedDependencies: null,
      packageManager: "unknown",
      logLevel: "info",
      mode: "bundle",
      audioLatencyHint: "interactive",
    });

    await fs.writeFile(path.join(REMOTION_BUNDLE_DIR, "index.html"), html, "utf8");
    await fs.copyFile(path.join(REMOTION_BUNDLER_DIR, "favicon.ico"), path.join(REMOTION_BUNDLE_DIR, "favicon.ico"));
    await fs.copyFile(
      path.join(path.dirname(runtimeRequire.resolve("source-map")), "lib", "mappings.wasm"),
      path.join(REMOTION_BUNDLE_DIR, SOURCE_MAP_ENDPOINT.replace("/", "")),
    );

    return REMOTION_BUNDLE_DIR;
  } finally {
    process.chdir(currentCwd);
  }
}

export async function renderMobileVideoToFile(payload: MobileVideoRenderPayload, outputPath: string) {
  await ensureRemotionWritableDirectories();
  const { renderMedia, selectComposition } = await import("@remotion/renderer");

  if (!bundlePromise) {
    bundlePromise = bundleMobileVideoWithWebpack().catch((error) => {
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
