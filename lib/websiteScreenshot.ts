import path from "node:path";

import { openBrowser } from "@remotion/renderer";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const CAPTURE_WIDTH = 1280;
const CAPTURE_VIEWPORT_HEIGHT = 1800;
const MAX_CAPTURE_HEIGHT = 6800;
const LOCAL_REMOTION_BROWSER_EXECUTABLE = path.join(
  process.cwd(),
  "node_modules",
  ".remotion",
  "chrome-headless-shell",
  process.platform === "win32" ? "win64" : process.platform === "darwin" ? "mac-x64" : "linux64",
  process.platform === "win32" ? "chrome-headless-shell-win64" : process.platform === "darwin" ? "chrome-headless-shell-mac-x64" : "chrome-headless-shell-linux64",
  process.platform === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell",
);

function normalizeScreenshotUrl(inputUrl: string) {
  const trimmed = inputUrl.trim();
  if (!trimmed) throw new Error("Add a website URL first.");

  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).toString();
  } catch {
    throw new Error("Enter a valid website URL.");
  }
}

async function getBrowserExecutable() {
  const isServerlessLinux = process.platform === "linux" && Boolean(process.env.VERCEL);

  if (isServerlessLinux) {
    const chromiumModule = (await import("@sparticuz/chromium")).default;
    chromiumModule.setGraphicsMode = false;
    return chromiumModule.executablePath();
  }

  if (process.platform === "win32") {
    const { promises: fs } = await import("node:fs");
    const hasLocalRemotionBrowser = await fs
      .stat(LOCAL_REMOTION_BROWSER_EXECUTABLE)
      .then(() => true)
      .catch(() => false);

    if (hasLocalRemotionBrowser) return LOCAL_REMOTION_BROWSER_EXECUTABLE;

    const { ensureBrowser } = await import("@remotion/renderer");
    const browser = await ensureBrowser({ logLevel: "warn" });
    if ("path" in browser) return browser.path;
  }

  return null;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown screenshot error";
}

type ChromeDevToolsClient = {
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
};

export async function captureWebsiteScreenshotDataUrl(inputUrl: string) {
  const url = normalizeScreenshotUrl(inputUrl);
  let browser: Awaited<ReturnType<typeof openBrowser>> | null = null;

  try {
    browser = await openBrowser("chrome", {
      browserExecutable: await getBrowserExecutable(),
      chromiumOptions: {
        gl: null,
        ignoreCertificateErrors: true,
        enableMultiProcessOnLinux: false,
      },
      logLevel: "warn",
    });

    const page = await browser.newPage({
      context: () => null,
      logLevel: "warn",
      indent: false,
      pageIndex: 0,
      onBrowserLog: null,
      onLog: () => undefined,
    });

    const client = page._client() as ChromeDevToolsClient;
    await page.setViewport({ width: CAPTURE_WIDTH, height: CAPTURE_VIEWPORT_HEIGHT, deviceScaleFactor: 1 });
    await client.send("Network.setUserAgentOverride", { userAgent: USER_AGENT });
    await page.goto({ url, timeout: 45000, options: { timeout: 45000 } });
    await page.evaluate(() => document.fonts?.ready);
    await page.evaluate(async () => {
      const maxY = Math.min(document.documentElement.scrollHeight || document.body.scrollHeight || 0, 5200);
      const steps = Math.max(1, Math.ceil(maxY / 900));

      for (let index = 0; index <= steps; index += 1) {
        const y = Math.round((maxY * index) / steps);
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    const dimensions = await page.evaluate(() => ({
      width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth),
      height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight),
    }));
    const captureHeight = Math.max(CAPTURE_VIEWPORT_HEIGHT, Math.min(MAX_CAPTURE_HEIGHT, Math.round(dimensions.height || CAPTURE_VIEWPORT_HEIGHT)));
    const response = (await client.send("Page.captureScreenshot", {
      format: "jpeg",
      quality: 88,
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: CAPTURE_WIDTH,
        height: captureHeight,
        scale: 1,
      },
    })) as { data?: string; value?: { data?: string } };
    const screenshotData = response.data ?? response.value?.data;

    if (!screenshotData) throw new Error("Could not capture website screenshot.");
    return `data:image/jpeg;base64,${screenshotData}`;
  } catch (error) {
    throw new Error(`Could not capture website screenshot: ${toErrorMessage(error)}`);
  } finally {
    await browser?.close({ silent: true }).catch(() => undefined);
  }
}
