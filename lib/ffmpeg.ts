import { toCanvas } from "html-to-image";

import { SceneStage } from "@/components/SceneStage";
import { getTransitionFrameMotion, isAnnouncementScene } from "@/lib/sceneTransitions";
import { exportResolutionDimensions } from "@/store/useStore";
import type { ExportSettings, Scene } from "@/store/useStore";

type FFmpegModule = typeof import("@ffmpeg/ffmpeg");
type FFmpegUtilModule = typeof import("@ffmpeg/util");
type ReactClientModule = typeof import("react-dom/client");
type ReactDomModule = typeof import("react-dom");
type ReactModule = typeof import("react");

let ffmpeg: InstanceType<FFmpegModule["FFmpeg"]> | null = null;
let ffmpegUtils: FFmpegUtilModule | null = null;
let ffmpegLoadPromise: Promise<void> | null = null;
let isLoaded = false;
let progressHandlerAttached = false;
let latestProgressCallback: ((value: number) => void) | undefined;
let lastFrameCount = 0;
let lastOutputFileName: string | null = null;
let lastFrameExtension: "png" | "jpg" = "png";
let reactRendererPromise:
  | Promise<{
      createRoot: ReactClientModule["createRoot"];
      flushSync: ReactDomModule["flushSync"];
      React: ReactModule;
    }>
  | null = null;
let renderHost: HTMLDivElement | null = null;
let renderRoot: ReturnType<ReactClientModule["createRoot"]> | null = null;
let renderHostSize: { width: number; height: number } | null = null;

const coreBaseUrl = "/ffmpeg";
const exportMediaReadyTimeoutMs = 3500;
type ExportRenderMode = "light" | "announcement-export";

function getVideoSize(settings: ExportSettings) {
  return exportResolutionDimensions[settings.resolution];
}

function getExportProfileConfig(settings: ExportSettings) {
  switch (settings.profile) {
    case "draft":
      return {
        fps: 15,
        frameExtension: "jpg" as const,
        frameMimeType: "image/jpeg",
        frameQuality: 0.7,
        ffmpegPreset: "ultrafast",
        crf: 28,
      };
    case "high":
      return {
        fps: 24,
        frameExtension: "jpg" as const,
        frameMimeType: "image/jpeg",
        frameQuality: 0.92,
        ffmpegPreset: "medium",
        crf: 21,
      };
    default:
      return {
        fps: 20,
        frameExtension: "jpg" as const,
        frameMimeType: "image/jpeg",
        frameQuality: 0.82,
        ffmpegPreset: "veryfast",
        crf: 24,
      };
  }
}

function getAnnouncementExportProfileConfig(settings: ExportSettings) {
  switch (settings.profile) {
    case "draft":
      return {
        fps: 12,
        frameExtension: "jpg" as const,
        frameMimeType: "image/jpeg",
        frameQuality: 0.66,
        ffmpegPreset: "ultrafast",
        crf: 30,
      };
    case "high":
      return {
        fps: 20,
        frameExtension: "jpg" as const,
        frameMimeType: "image/jpeg",
        frameQuality: 0.86,
        ffmpegPreset: "veryfast",
        crf: 24,
      };
    default:
      return {
        fps: 16,
        frameExtension: "jpg" as const,
        frameMimeType: "image/jpeg",
        frameQuality: 0.76,
        ffmpegPreset: "ultrafast",
        crf: 27,
      };
  }
}

function createCanvas(videoWidth: number, videoHeight: number) {
  const canvas = document.createElement("canvas");
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not available in this browser.");
  return { canvas, ctx };
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getTotalFrameCount(scenes: Scene[], fps: number, transitionFrameCount: number, includeTransitions: boolean) {
  return scenes.reduce((total, scene, sceneIndex) => {
    const nextScene = scenes[sceneIndex + 1];
    const stillFrameCount = Math.max(1, Math.round(scene.durationSeconds * fps));
    return total + stillFrameCount + (includeTransitions && nextScene ? transitionFrameCount : 0);
  }, 0);
}

async function getReactRenderer() {
  if (!reactRendererPromise) {
    reactRendererPromise = Promise.all([import("react-dom/client"), import("react-dom"), import("react")]).then(([reactClient, reactDom, React]) => ({
      createRoot: reactClient.createRoot,
      flushSync: reactDom.flushSync,
      React,
    }));
  }

  return reactRendererPromise;
}

function cleanupRenderSurface() {
  renderRoot?.unmount();
  renderRoot = null;
  renderHost?.remove();
  renderHost = null;
  renderHostSize = null;
}

function syncExportHostStyles(host: HTMLDivElement) {
  const rootStyles = getComputedStyle(document.documentElement);
  const bodyStyles = getComputedStyle(document.body);

  for (const styles of [rootStyles, bodyStyles]) {
    for (let index = 0; index < styles.length; index += 1) {
      const propertyName = styles.item(index);
      if (!propertyName || !propertyName.startsWith("--")) continue;
      host.style.setProperty(propertyName, styles.getPropertyValue(propertyName));
    }
  }

  host.style.fontFamily = bodyStyles.fontFamily;
  host.style.color = bodyStyles.color;
  host.style.backgroundColor = "transparent";
}

async function waitForImageReady(image: HTMLImageElement) {
  if (image.complete && image.naturalWidth > 0) {
    try {
      if (typeof image.decode === "function") {
        await image.decode();
      }
    } catch {
      // Some browsers reject decode() for cached images; the element is still usable.
    }
    return;
  }

  await new Promise<void>((resolve) => {
    const settle = () => resolve();
    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
  });

  try {
    if (typeof image.decode === "function") {
      await image.decode();
    }
  } catch {
    // Ignore decode errors and continue with the rendered element.
  }
}

async function waitForExportAssets(node: HTMLElement) {
  await document.fonts.ready;

  const images = Array.from(node.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(images.map((image) => waitForImageReady(image)));

  const startedAt = performance.now();
  while (performance.now() - startedAt < exportMediaReadyTimeoutMs) {
    if (!node.querySelector('[data-lottie-ready="false"]')) {
      break;
    }
    await nextFrame();
  }

  await nextFrame();
  await nextFrame();
}

function getExportAssetKey(scene: Scene, renderLayer: "full" | "background" | "content", renderMode: ExportRenderMode) {
  return [
    scene.id,
    renderLayer,
    renderMode,
    scene.websiteImageUrl,
    scene.logoImageUrl,
    scene.authorImageUrl,
    scene.bulletImageUrls.join("|"),
  ].join("::");
}

async function ensureRenderSurface(videoWidth: number, videoHeight: number) {
  const { createRoot } = await getReactRenderer();

  const needsNewSurface =
    !renderHost ||
    !renderRoot ||
    !renderHostSize ||
    renderHostSize.width !== videoWidth ||
    renderHostSize.height !== videoHeight;

  if (needsNewSurface) {
    cleanupRenderSurface();
    renderHost = document.createElement("div");
    renderHost.style.position = "fixed";
    renderHost.style.left = "-20000px";
    renderHost.style.top = "0";
    renderHost.style.width = `${videoWidth}px`;
    renderHost.style.height = `${videoHeight}px`;
    renderHost.style.pointerEvents = "none";
    renderHost.style.zIndex = "-1";
    document.body.appendChild(renderHost);
    syncExportHostStyles(renderHost);
    renderRoot = createRoot(renderHost);
    renderHostSize = { width: videoWidth, height: videoHeight };
  }

  if (!renderHost || !renderRoot) {
    throw new Error("Could not initialize export render surface.");
  }

  return { host: renderHost, root: renderRoot };
}

async function renderSceneDomToCanvas(
  scene: Scene,
  settings: ExportSettings,
  progress: number,
  renderMode: ExportRenderMode,
  assetReadinessCache?: Map<string, Promise<void>>,
) {
  return renderSceneLayerToCanvas(scene, settings, progress, "full", renderMode, assetReadinessCache);
}

async function renderSceneLayerToCanvas(
  scene: Scene,
  settings: ExportSettings,
  progress: number,
  renderLayer: "full" | "background" | "content",
  renderMode: ExportRenderMode,
  assetReadinessCache?: Map<string, Promise<void>>,
) {
  const { width: videoWidth, height: videoHeight } = getVideoSize(settings);
  const { host, root } = await ensureRenderSurface(videoWidth, videoHeight);
  const { flushSync, React } = await getReactRenderer();

  flushSync(() => {
    root.render(
      React.createElement(
        "div",
        {
          style: {
            width: `${videoWidth}px`,
            height: `${videoHeight}px`,
          },
        },
        React.createElement(SceneStage, {
          scene,
          backgroundColor: settings.backgroundColor,
          textColor: settings.textColor,
          preset: settings.preset,
          performanceMode: renderMode,
          renderLayer,
          progress,
        }),
      ),
    );
  });

  await document.fonts.ready;
  const node = host.firstElementChild as HTMLElement | null;
  if (!node) throw new Error("Could not render scene preview for export.");

  const assetKey = getExportAssetKey(scene, renderLayer, renderMode);
  if (assetReadinessCache) {
    let readinessPromise = assetReadinessCache.get(assetKey);
    if (!readinessPromise) {
      readinessPromise = waitForExportAssets(node);
      assetReadinessCache.set(assetKey, readinessPromise);
    }
    await readinessPromise;
  } else {
    await waitForExportAssets(node);
  }

  try {
    return await toCanvas(node, {
      cacheBust: true,
      pixelRatio: 1,
      canvasWidth: videoWidth,
      canvasHeight: videoHeight,
      width: videoWidth,
      height: videoHeight,
      skipAutoScale: true,
    });
  } finally {
    flushSync(() => {
      root.render(React.createElement("div"));
    });
  }
}

function normalizeSceneProgress(scene: Scene, progress: number) {
  const clamped = clampProgress(progress);
  return Number(clamped.toFixed(3));
}

function getRenderCacheKey(scene: Scene, settings: ExportSettings, progress: number, renderMode: ExportRenderMode) {
  return [
    scene.id,
    scene.type,
    renderMode,
    settings.resolution,
    settings.preset,
    settings.backgroundColor,
    settings.textColor,
    progress.toFixed(4),
    scene.title,
    scene.subtitle,
    scene.description,
    scene.eyebrow,
    scene.websiteImageUrl,
    scene.logoImageUrl,
    scene.authorImageUrl,
    scene.mediaPosition,
    scene.bullets.join("|"),
    scene.bulletEmojis.join("|"),
    scene.bulletImageUrls.join("|"),
  ].join("::");
}

async function renderSceneCanvasCached(
  scene: Scene,
  settings: ExportSettings,
  progress: number,
  cache: Map<string, HTMLCanvasElement>,
  allowCache: boolean,
  renderMode: ExportRenderMode,
  assetReadinessCache?: Map<string, Promise<void>>,
) {
  if (!allowCache) return renderSceneDomToCanvas(scene, settings, progress, renderMode, assetReadinessCache);
  const cacheKey = getRenderCacheKey(scene, settings, progress, renderMode);
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const rendered = await renderSceneDomToCanvas(scene, settings, progress, renderMode, assetReadinessCache);
  cache.set(cacheKey, rendered);
  return rendered;
}

function getFrameProgress(frameIndex: number, frameCount: number) {
  if (frameCount <= 1) return 1;
  return Math.min(1, Math.max(0, frameIndex / (frameCount - 1)));
}

async function renderSceneCompositeCanvasCached(
  scene: Scene,
  settings: ExportSettings,
  progress: number,
  cache: Map<string, HTMLCanvasElement>,
  allowCache: boolean,
  renderMode: ExportRenderMode,
  assetReadinessCache?: Map<string, Promise<void>>,
) {
  const cacheKey = `${getRenderCacheKey(scene, settings, progress, renderMode)}::composite`;
  const cached = allowCache ? cache.get(cacheKey) : null;
  if (cached) return cached;

  const { width: videoWidth, height: videoHeight } = getVideoSize(settings);
  const { canvas, ctx } = createCanvas(videoWidth, videoHeight);
  const backgroundCanvas = await renderSceneLayerToCanvas(scene, settings, progress, "background", renderMode, assetReadinessCache);
  const contentCanvas = await renderSceneLayerToCanvas(scene, settings, progress, "content", renderMode, assetReadinessCache);

  ctx.drawImage(backgroundCanvas, 0, 0, videoWidth, videoHeight);
  ctx.drawImage(contentCanvas, 0, 0, videoWidth, videoHeight);

  if (allowCache) cache.set(cacheKey, canvas);
  return canvas;
}

async function renderTransitionFrame(currentScene: Scene, nextScene: Scene, settings: ExportSettings, progress: number, cache: Map<string, HTMLCanvasElement>, assetReadinessCache: Map<string, Promise<void>>) {
  const { width: videoWidth, height: videoHeight } = getVideoSize(settings);
  const { canvas, ctx } = createCanvas(videoWidth, videoHeight);
  const normalizedCurrentProgress = normalizeSceneProgress(currentScene, 1);
  const normalizedNextProgress = normalizeSceneProgress(nextScene, 0);
  // These renders must stay sequential because all export captures share one
  // offscreen React root. Parallel rendering causes layers to overwrite each
  // other and can produce empty/black transition frames.
  const currentCanvas = await renderSceneCompositeCanvasCached(currentScene, settings, normalizedCurrentProgress, cache, false, "light", assetReadinessCache);
  const nextCanvas = await renderSceneCompositeCanvasCached(nextScene, settings, normalizedNextProgress, cache, false, "light", assetReadinessCache);
  const motion = getTransitionFrameMotion(currentScene.transition, progress, videoWidth, videoHeight);

  if (currentCanvas && motion.currentOpacity > 0.001) {
    const currentWidth = videoWidth * motion.currentScale;
    const currentHeight = videoHeight * motion.currentScale;
    ctx.save();
    ctx.globalAlpha = motion.currentOpacity;
    ctx.drawImage(currentCanvas, motion.currentX - (currentWidth - videoWidth) / 2, motion.currentY - (currentHeight - videoHeight) / 2, currentWidth, currentHeight);
    ctx.restore();
  }

  if (nextCanvas && motion.nextOpacity > 0.001) {
    const nextWidth = videoWidth * motion.nextScale;
    const nextHeight = videoHeight * motion.nextScale;
    ctx.save();
    ctx.globalAlpha = motion.nextOpacity;
    ctx.drawImage(nextCanvas, motion.nextX - (nextWidth - videoWidth) / 2, motion.nextY - (nextHeight - videoHeight) / 2, nextWidth, nextHeight);
    ctx.restore();
  }

  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not convert canvas to an image blob."));
    }, mimeType, quality);
  });
}

async function writeCanvasFrame(frameIndex: number, canvas: HTMLCanvasElement, frameExtension: "png" | "jpg", frameMimeType: string, frameQuality?: number) {
  if (!ffmpegUtils || !ffmpeg) throw new Error("FFmpeg is not ready yet.");
  const blob = await canvasToBlob(canvas, frameMimeType, frameQuality);
  const fileData = await ffmpegUtils.fetchFile(blob);
  await ffmpeg.writeFile(`frame${String(frameIndex).padStart(4, "0")}.${frameExtension}`, fileData);
}

export async function ensureFFmpegLoaded() {
  if (isLoaded) return;
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const [{ FFmpeg }, ffmpegUtilModule] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
      ffmpeg = new FFmpeg();
      ffmpegUtils = ffmpegUtilModule;
      await ffmpeg.load({
        coreURL: await ffmpegUtilModule.toBlobURL(`${coreBaseUrl}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await ffmpegUtilModule.toBlobURL(`${coreBaseUrl}/ffmpeg-core.wasm`, "application/wasm"),
      });
      isLoaded = true;
      if (!progressHandlerAttached) {
        ffmpeg.on("progress", ({ progress }) => latestProgressCallback?.(progress));
        progressHandlerAttached = true;
      }
    })();
  }
  await ffmpegLoadPromise;
}

function toSafeVideoFileName(projectName?: string) {
  const baseName = (projectName ?? "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();

  return `${baseName || "video-project"}.mp4`;
}

function optimizeSceneForAnnouncementExport(scene: Scene): Scene {
  if (scene.type !== "announcement-hero") return scene;

  const projectCount = Math.min(scene.projectCount ?? 8, 9);
  return {
    ...scene,
    projectCount,
    projectImageUrls: Array.from({ length: projectCount }, (_, index) => scene.projectImageUrls?.[index] ?? ""),
  };
}

export async function exportSlidesToVideo(scenes: Scene[], settings: ExportSettings, onProgress?: (value: number) => void, projectName?: string) {
  if (scenes.length === 0) throw new Error("Add at least one scene before exporting.");
  onProgress?.(0.02);
  await ensureFFmpegLoaded();
  if (!ffmpeg) throw new Error("FFmpeg is not ready yet.");

  const hasAnnouncementScenes = scenes.some((scene) => isAnnouncementScene(scene));
  const exportMode: ExportRenderMode = hasAnnouncementScenes ? "announcement-export" : "light";
  const includeTransitions = !hasAnnouncementScenes;
  const scenesForExport = hasAnnouncementScenes ? scenes.map((scene) => optimizeSceneForAnnouncementExport(scene)) : scenes;
  const { fps, frameExtension, frameMimeType, frameQuality, ffmpegPreset, crf } = hasAnnouncementScenes
    ? getAnnouncementExportProfileConfig(settings)
    : getExportProfileConfig(settings);
  const { width: videoWidth, height: videoHeight } = getVideoSize(settings);
  const transitionFrameCount = Math.max(1, Math.round(settings.transitionSeconds * fps));
  const totalFrameCount = Math.max(1, getTotalFrameCount(scenesForExport, fps, transitionFrameCount, includeTransitions));
  const frameRenderWeight = 0.88;
  const encodeWeight = 0.12;
  const renderCache = new Map<string, HTMLCanvasElement>();
  const exportAssetReadinessCache = new Map<string, Promise<void>>();

  latestProgressCallback = (progress) => {
    onProgress?.(clampProgress(frameRenderWeight + progress * encodeWeight));
  };
  onProgress?.(0.06);

  try {
    for (let index = 1; index <= lastFrameCount; index += 1) {
      await ffmpeg.deleteFile(`frame${String(index).padStart(4, "0")}.${lastFrameExtension}`).catch(() => undefined);
      if (lastFrameExtension !== frameExtension) {
        await ffmpeg.deleteFile(`frame${String(index).padStart(4, "0")}.${frameExtension}`).catch(() => undefined);
      }
    }
    if (lastOutputFileName) {
      await ffmpeg.deleteFile(lastOutputFileName).catch(() => undefined);
      lastOutputFileName = null;
    }

    let frameIndex = 1;
    let renderedFrameCount = 0;

    const reportFrameProgress = () => {
      onProgress?.(clampProgress((renderedFrameCount / totalFrameCount) * frameRenderWeight));
    };

    for (let sceneIndex = 0; sceneIndex < scenesForExport.length; sceneIndex += 1) {
      const scene = scenesForExport[sceneIndex];
      const nextScene = scenesForExport[sceneIndex + 1];
      const totalSceneFrameCount = Math.max(1, Math.round(scene.durationSeconds * fps));
      const stillFrameCount = totalSceneFrameCount;

      for (let repeat = 0; repeat < stillFrameCount; repeat += 1) {
        const sceneProgress = getFrameProgress(repeat, totalSceneFrameCount);
        const normalizedSceneProgress = normalizeSceneProgress(scene, sceneProgress);
        const sceneCanvas = await renderSceneCanvasCached(scene, settings, normalizedSceneProgress, renderCache, true, exportMode, exportAssetReadinessCache);
        await writeCanvasFrame(frameIndex, sceneCanvas, frameExtension, frameMimeType, frameQuality);
        renderedFrameCount += 1;
        reportFrameProgress();
        frameIndex += 1;
      }

      if (includeTransitions && nextScene) {
        for (let transitionStep = 0; transitionStep < transitionFrameCount; transitionStep += 1) {
          const progress = (transitionStep + 1) / transitionFrameCount;
          const transitionCanvas = await renderTransitionFrame(scene, nextScene, settings, progress, renderCache, exportAssetReadinessCache);
          await writeCanvasFrame(frameIndex, transitionCanvas, frameExtension, frameMimeType, frameQuality);
          renderedFrameCount += 1;
          reportFrameProgress();
          frameIndex += 1;
        }
      }
    }

    onProgress?.(frameRenderWeight);
    const outputFileName = `output-${Date.now()}.mp4`;
    await ffmpeg.exec(["-framerate", String(fps), "-i", `frame%04d.${frameExtension}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", ffmpegPreset, "-crf", String(crf), "-movflags", "+faststart", outputFileName]);
    const videoData = (await ffmpeg.readFile(outputFileName, "binary")) as Uint8Array;
    const videoBuffer = videoData.buffer.slice(videoData.byteOffset, videoData.byteOffset + videoData.byteLength) as ArrayBuffer;
    const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });
    const downloadUrl = URL.createObjectURL(videoBlob);

    lastFrameCount = frameIndex - 1;
    lastOutputFileName = outputFileName;
    lastFrameExtension = frameExtension;
    latestProgressCallback = undefined;
    onProgress?.(1);

    return {
      blob: videoBlob,
      url: downloadUrl,
      fileName: toSafeVideoFileName(projectName),
      meta: { width: videoWidth, height: videoHeight, fps, transitionSeconds: includeTransitions ? settings.transitionSeconds : 0 },
    };
  } finally {
    latestProgressCallback = undefined;
    cleanupRenderSurface();
  }
}
