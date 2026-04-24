const fs = require("node:fs/promises");
const path = require("node:path");

const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";

let bundlePromise;

const ensureBundle = async () => {
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

  return bundlePromise;
};

const main = async () => {
  const [, , payloadPath, outputPath] = process.argv;

  if (!payloadPath || !outputPath) {
    throw new Error("Usage: node scripts/render-mobile-video.cjs <payloadPath> <outputPath>");
  }
  const payload = JSON.parse(await fs.readFile(payloadPath, "utf8"));
  const serveUrl = await ensureBundle();
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
};

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(message);
  process.exit(1);
});
