import { toCanvas } from "html-to-image";

import { SceneStage } from "@/components/SceneStage";
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

const coreBaseUrl = "/ffmpeg";
const videoWidth = 1280;
const videoHeight = 720;

function easeInOut(value: number) {
  return 0.5 - Math.cos(Math.min(1, Math.max(0, value)) * Math.PI) / 2;
}

function createCanvas() {
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

async function renderSceneDomToCanvas(scene: Scene, settings: ExportSettings, progress: number) {
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

function getFrameProgress(frameIndex: number, frameCount: number) {
  if (frameCount <= 1) return 1;
  return Math.min(1, Math.max(0, frameIndex / (frameCount - 1)));
}

async function renderTransitionFrame(currentScene: Scene, nextScene: Scene, settings: ExportSettings, progress: number, nextSceneProgress: number) {
  const { canvas, ctx } = createCanvas();
  const eased = easeInOut(progress);
  const [currentCanvas, nextCanvas] = await Promise.all([
    renderSceneDomToCanvas(currentScene, settings, 1),
    renderSceneDomToCanvas(nextScene, settings, nextSceneProgress),
  ]);

  if (currentScene.transition === "slide-left") {
    ctx.save();
    ctx.globalAlpha = 1 - eased * 0.15;
    ctx.translate(-videoWidth * eased, 0);
    ctx.drawImage(currentCanvas, 0, 0, videoWidth, videoHeight);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.2 + eased * 0.8;
    ctx.translate(videoWidth * (1 - eased), 0);
    ctx.drawImage(nextCanvas, 0, 0, videoWidth, videoHeight);
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = 1 - eased;
    ctx.drawImage(currentCanvas, 0, 0, videoWidth, videoHeight);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = eased;
    ctx.drawImage(nextCanvas, 0, 0, videoWidth, videoHeight);
    ctx.restore();
  }

  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not convert canvas to PNG."));
    }, "image/png");
  });
}

async function writeCanvasFrame(frameIndex: number, canvas: HTMLCanvasElement) {
  if (!ffmpegUtils || !ffmpeg) throw new Error("FFmpeg is not ready yet.");
  const blob = await canvasToBlob(canvas);
  const fileData = await ffmpegUtils.fetchFile(blob);
  await ffmpeg.writeFile(`frame${String(frameIndex).padStart(4, "0")}.png`, fileData);
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
  await ensureFFmpegLoaded();
  if (!ffmpeg) throw new Error("FFmpeg is not ready yet.");

  latestProgressCallback = onProgress;

  for (let index = 1; index <= lastFrameCount; index += 1) {
    await ffmpeg.deleteFile(`frame${String(index).padStart(4, "0")}.png`).catch(() => undefined);
  }
  if (lastOutputFileName) {
    await ffmpeg.deleteFile(lastOutputFileName).catch(() => undefined);
    lastOutputFileName = null;
  }

  const fps = settings.fps;
  const transitionFrameCount = Math.max(1, Math.round(settings.transitionSeconds * fps));
  let frameIndex = 1;

  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    const scene = scenes[sceneIndex];
    const nextScene = scenes[sceneIndex + 1];
    const totalSceneFrameCount = Math.max(1, Math.round(scene.durationSeconds * fps));
    const incomingTransitionFrames = sceneIndex === 0 ? 0 : transitionFrameCount;
    const stillFrameCount = Math.max(1, Math.round(scene.durationSeconds * fps) - (nextScene ? transitionFrameCount : 0));

    for (let repeat = 0; repeat < stillFrameCount; repeat += 1) {
      const sceneProgress = getFrameProgress(repeat + incomingTransitionFrames, totalSceneFrameCount);
      await writeCanvasFrame(frameIndex, await renderStillFrame(scene, settings, sceneProgress));
      frameIndex += 1;
    }

    if (nextScene) {
      const nextSceneTotalFrameCount = Math.max(1, Math.round(nextScene.durationSeconds * fps));
      for (let transitionStep = 0; transitionStep < transitionFrameCount; transitionStep += 1) {
        const progress = (transitionStep + 1) / transitionFrameCount;
        const nextSceneProgress = getFrameProgress(transitionStep, nextSceneTotalFrameCount);
        await writeCanvasFrame(frameIndex, await renderTransitionFrame(scene, nextScene, settings, progress, nextSceneProgress));
        frameIndex += 1;
      }
    }
  }

  const outputFileName = `output-${Date.now()}.mp4`;
  await ffmpeg.exec(["-framerate", String(fps), "-i", "frame%04d.png", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", outputFileName]);
  const videoData = (await ffmpeg.readFile(outputFileName, "binary")) as Uint8Array;
  const videoBuffer = videoData.buffer.slice(videoData.byteOffset, videoData.byteOffset + videoData.byteLength) as ArrayBuffer;
  const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });
  const downloadUrl = URL.createObjectURL(videoBlob);

  lastFrameCount = frameIndex - 1;
  lastOutputFileName = outputFileName;
  latestProgressCallback = undefined;
  onProgress?.(1);

  return {
    blob: videoBlob,
    url: downloadUrl,
    fileName: "output.mp4",
    meta: { width: videoWidth, height: videoHeight, fps, transitionSeconds: settings.transitionSeconds },
  };
}
