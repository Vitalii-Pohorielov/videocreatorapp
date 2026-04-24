const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

const MOBILE_VIDEO_COMPOSITION_ID = "MobileVideo";

let bundlePromise;
let stylesPromise;

const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `${command} exited with code ${code}.`));
    });
  });
};

const ensureRemotionStyles = async () => {
  if (!stylesPromise) {
    stylesPromise = runCommand(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["tailwindcss", "-i", "./app/globals.css", "-o", "./remotion/generated.css"],
    ).catch((error) => {
      stylesPromise = undefined;
      throw error;
    });
  }

  return stylesPromise;
};

const ensureBundle = async () => {
  if (!bundlePromise) {
    await ensureRemotionStyles();
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
