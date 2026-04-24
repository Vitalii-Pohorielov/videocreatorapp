const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { bundle } = require("@remotion/bundler");

const MOBILE_VIDEO_PUBLIC_ASSETS = ["scene-assets/announcement-backgrounds/announcement-hero-bg.mp4"];
const OUTPUT_DIR = path.join(process.cwd(), "public", "remotion-bundles", "mobile-video");

async function syncMinimalPublicDir(tempPublicDir) {
  await fs.rm(tempPublicDir, { recursive: true, force: true });
  await fs.mkdir(tempPublicDir, { recursive: true });

  await Promise.all(
    MOBILE_VIDEO_PUBLIC_ASSETS.map(async (relativeAssetPath) => {
      const sourcePath = path.join(process.cwd(), "public", relativeAssetPath);
      const destinationPath = path.join(tempPublicDir, relativeAssetPath);

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

async function buildMobileVideoBundle() {
  const tempPublicDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-creator-mobile-public-"));

  try {
    await syncMinimalPublicDir(tempPublicDir);
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });

    await bundle({
      entryPoint: path.join(process.cwd(), "remotion", "root.tsx"),
      outDir: OUTPUT_DIR,
      publicDir: tempPublicDir,
      enableCaching: true,
      rootDir: process.cwd(),
      onProgress: () => undefined,
      onPublicDirCopyProgress: () => undefined,
      onSymlinkDetected: () => undefined,
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

    console.log(`[mobile-video/bundle] Prebuilt bundle written to ${OUTPUT_DIR}`);
  } finally {
    await fs.rm(tempPublicDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

buildMobileVideoBundle().catch((error) => {
  console.error("[mobile-video/bundle] Failed to build prebuilt bundle", error);
  process.exitCode = 1;
});
