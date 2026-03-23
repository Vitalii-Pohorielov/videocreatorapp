import { toCanvas } from "html-to-image";

import { SceneStage } from "@/components/SceneStage";
import { exportResolutionDimensions } from "@/store/useStore";
import type { ExportSettings, Scene } from "@/store/useStore";

type FFmpegModule = typeof import("@ffmpeg/ffmpeg");
type FFmpegUtilModule = typeof import("@ffmpeg/util");

let ffmpeg: InstanceType<FFmpegModule["FFmpeg"]> | null = null;
let ffmpegUtils: FFmpegUtilModule | null = null;
let ffmpegLoadPromise: Promise<void> | null = null;
let isLoaded = false;
let progressHandlerAttached = false;
let latestProgressCallback: ((value: number) => void) | undefined;
let lastFrameCount = 0;
let lastOutputFileName: string | null = null;
let lastFrameExtension: "png" | "jpg" = "png";

const coreBaseUrl = "/ffmpeg";

function getVideoSize(settings: ExportSettings) {
  return exportResolutionDimensions[settings.resolution];
}

function getExportProfileConfig(settings: ExportSettings) {
  switch (settings.profile) {
    case "draft":
      return {
        frameExtension: "jpg" as const,
        frameMimeType: "image/jpeg",
        frameQuality: 0.72,
        ffmpegPreset: "ultrafast",
      };
    case "high":
      return {
        frameExtension: "png" as const,
        frameMimeType: "image/png",
        frameQuality: undefined,
        ffmpegPreset: "medium",
      };
    default:
      return {
        frameExtension: "jpg" as const,
        frameMimeType: "image/jpeg",
        frameQuality: 0.84,
        ffmpegPreset: "veryfast",
      };
  }
}

function easeInOut(value: number) {
  return 0.5 - Math.cos(Math.min(1, Math.max(0, value)) * Math.PI) / 2;
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

function getTotalFrameCount(scenes: Scene[], fps: number, transitionFrameCount: number) {
  return scenes.reduce((total, scene, sceneIndex) => {
    const nextScene = scenes[sceneIndex + 1];
    const stillFrameCount = Math.max(1, Math.round(scene.durationSeconds * fps) - (nextScene ? transitionFrameCount : 0));
    return total + stillFrameCount + (nextScene ? transitionFrameCount : 0);
  }, 0);
}

async function renderSceneDomToCanvas(scene: Scene, settings: ExportSettings, progress: number) {
  const { width: videoWidth, height: videoHeight } = getVideoSize(settings);
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.width = `${videoWidth}px`;
  host.style.height = `${videoHeight}px`;
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  document.body.appendChild(host);

  const [{ createRoot }, { flushSync }, React] = await Promise.all([import("react-dom/client"), import("react-dom"), import("react")]);
  const root = createRoot(host);

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
          progress,
        }),
      ),
    );
  });

  await document.fonts.ready;
  await nextFrame();
  await nextFrame();
  await nextFrame();

  const node = host.firstElementChild as HTMLElement | null;
  if (!node) {
    root.unmount();
    host.remove();
    throw new Error("Could not render scene preview for export.");
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
    root.unmount();
    host.remove();
  }
}

async function renderStillFrame(scene: Scene, settings: ExportSettings, progress: number) {
  return renderSceneDomToCanvas(scene, settings, progress);
}

function getRenderCacheKey(scene: Scene, settings: ExportSettings, progress: number) {
  return [
    scene.id,
    scene.type,
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

async function renderSceneCanvasCached(scene: Scene, settings: ExportSettings, progress: number, cache: Map<string, HTMLCanvasElement>, allowCache: boolean) {
  if (!allowCache) return renderSceneDomToCanvas(scene, settings, progress);
  const cacheKey = getRenderCacheKey(scene, settings, progress);
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const rendered = await renderSceneDomToCanvas(scene, settings, progress);
  cache.set(cacheKey, rendered);
  return rendered;
}

function getFrameProgress(frameIndex: number, frameCount: number) {
  if (frameCount <= 1) return 1;
  return Math.min(1, Math.max(0, frameIndex / (frameCount - 1)));
}

async function renderTransitionFrame(currentScene: Scene, nextScene: Scene, settings: ExportSettings, progress: number, nextSceneProgress: number, cache: Map<string, HTMLCanvasElement>) {
  const { width: videoWidth, height: videoHeight } = getVideoSize(settings);
  const { canvas, ctx } = createCanvas(videoWidth, videoHeight);
  const eased = easeInOut(progress);
  const [currentCanvas, nextCanvas] = await Promise.all([
    renderSceneCanvasCached(currentScene, settings, 1, cache, true),
    renderSceneCanvasCached(nextScene, settings, nextSceneProgress, cache, false),
  ]);

  ctx.save();
  ctx.globalAlpha = 1 - eased;
  ctx.drawImage(currentCanvas, 0, 0, videoWidth, videoHeight);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = eased;
  ctx.drawImage(nextCanvas, 0, 0, videoWidth, videoHeight);
  ctx.restore();

  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not convert canvas to PNG."));
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

export async function exportSlidesToVideo(scenes: Scene[], settings: ExportSettings, onProgress?: (value: number) => void) {
  if (scenes.length === 0) throw new Error("Add at least one scene before exporting.");
  onProgress?.(0.02);
  await ensureFFmpegLoaded();
  if (!ffmpeg) throw new Error("FFmpeg is not ready yet.");

  const fps = settings.fps;
  const { width: videoWidth, height: videoHeight } = getVideoSize(settings);
  const { frameExtension, frameMimeType, frameQuality, ffmpegPreset } = getExportProfileConfig(settings);
  const transitionFrameCount = Math.max(1, Math.round(settings.transitionSeconds * fps));
  const totalFrameCount = Math.max(1, getTotalFrameCount(scenes, fps, transitionFrameCount));
  const frameRenderWeight = 0.88;
  const encodeWeight = 0.12;
  const renderCache = new Map<string, HTMLCanvasElement>();

  latestProgressCallback = (progress) => {
    onProgress?.(clampProgress(frameRenderWeight + progress * encodeWeight));
  };
  onProgress?.(0.06);

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

  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    const scene = scenes[sceneIndex];
    const nextScene = scenes[sceneIndex + 1];
    const totalSceneFrameCount = Math.max(1, Math.round(scene.durationSeconds * fps));
    const incomingTransitionFrames = sceneIndex === 0 ? 0 : transitionFrameCount;
    const stillFrameCount = Math.max(1, Math.round(scene.durationSeconds * fps) - (nextScene ? transitionFrameCount : 0));

    for (let repeat = 0; repeat < stillFrameCount; repeat += 1) {
      const sceneProgress = getFrameProgress(repeat + incomingTransitionFrames, totalSceneFrameCount);
      const sceneCanvas = await renderSceneCanvasCached(scene, settings, sceneProgress, renderCache, sceneProgress === 1);
      await writeCanvasFrame(frameIndex, sceneCanvas, frameExtension, frameMimeType, frameQuality);
      renderedFrameCount += 1;
      reportFrameProgress();
      frameIndex += 1;
    }

    if (nextScene) {
      const nextSceneTotalFrameCount = Math.max(1, Math.round(nextScene.durationSeconds * fps));
      for (let transitionStep = 0; transitionStep < transitionFrameCount; transitionStep += 1) {
        const progress = (transitionStep + 1) / transitionFrameCount;
        const nextSceneProgress = getFrameProgress(transitionStep, nextSceneTotalFrameCount);
        await writeCanvasFrame(frameIndex, await renderTransitionFrame(scene, nextScene, settings, progress, nextSceneProgress, renderCache), frameExtension, frameMimeType, frameQuality);
        renderedFrameCount += 1;
        reportFrameProgress();
        frameIndex += 1;
      }
    }
  }

  onProgress?.(frameRenderWeight);
  const outputFileName = `output-${Date.now()}.mp4`;
  await ffmpeg.exec(["-framerate", String(fps), "-i", `frame%04d.${frameExtension}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", ffmpegPreset, outputFileName]);
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
    fileName: "output.mp4",
    meta: { width: videoWidth, height: videoHeight, fps, transitionSeconds: settings.transitionSeconds },
  };
}
