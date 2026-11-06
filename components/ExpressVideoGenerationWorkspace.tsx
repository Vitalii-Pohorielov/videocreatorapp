"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { fileToStoredUrl } from "@/lib/imageUpload";
import { exportSlidesToVideo } from "@/lib/ffmpeg";
import type { ExportSettings, Scene, SceneTrack } from "@/lib/sceneDefinitions";
import { splitSloganIntoThreeLines } from "@/lib/sloganLines";

// Keep in sync with MAX_EXPRESS_BATCH_URLS in lib/expressVideoBatch.ts.
// Defined locally because that module imports server-only dependencies
// (fs, @remotion/renderer) that cannot be bundled into a client component.
const MAX_EXPRESS_BATCH_URLS = 15;

type BatchStatus = "idle" | "queued" | "scraping" | "rendering" | "zipping" | "done" | "error";
type ProjectStatus = "queued" | "scraping" | "ready" | "error";

type BatchProgress = {
  phase: BatchStatus;
  current: number;
  total: number;
  completed: number;
  currentUrl: string | null;
  currentFileName: string | null;
  message: string;
};

type PreparedProject = {
  sourceUrl: string;
  projectName: string;
  slogan: string;
  logoImageUrl: string;
  sceneTrack: SceneTrack;
  exportSettings: ExportSettings;
};

type ProjectDraft = {
  url: string;
  status: ProjectStatus;
  error: string | null;
  project: PreparedProject | null;
};

type ZipEntry = {
  name: string;
  data: ArrayBuffer;
};

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function getCrc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | (date.getMonth() + 1) << 5 | date.getDate();

  return { dosDate, dosTime };
}

function writeUInt16LE(buffer: Uint8Array, offset: number, value: number) {
  new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength).setUint16(offset, value, true);
}

function writeUInt32LE(buffer: Uint8Array, offset: number, value: number) {
  new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength).setUint32(offset, value, true);
}

function concatUint8Arrays(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return combined;
}

function createZipBlob(entries: ZipEntry[]) {
  const encoder = new TextEncoder();
  const localParts: BlobPart[] = [];
  const centralParts: Uint8Array[] = [];
  const { dosDate, dosTime } = getDosDateTime();
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = encoder.encode(entry.name);
    const crc32 = getCrc32(new Uint8Array(entry.data));

    const localHeader = new Uint8Array(30);
    writeUInt32LE(localHeader, 0, 0x04034b50);
    writeUInt16LE(localHeader, 4, 20);
    writeUInt16LE(localHeader, 6, 0x0800);
    writeUInt16LE(localHeader, 8, 0);
    writeUInt16LE(localHeader, 10, dosTime);
    writeUInt16LE(localHeader, 12, dosDate);
    writeUInt32LE(localHeader, 14, crc32);
    writeUInt32LE(localHeader, 18, entry.data.byteLength);
    writeUInt32LE(localHeader, 22, entry.data.byteLength);
    writeUInt16LE(localHeader, 26, nameBuffer.length);
    writeUInt16LE(localHeader, 28, 0);
    localParts.push(localHeader, nameBuffer, entry.data);

    const centralHeader = new Uint8Array(46);
    writeUInt32LE(centralHeader, 0, 0x02014b50);
    writeUInt16LE(centralHeader, 4, 20);
    writeUInt16LE(centralHeader, 6, 20);
    writeUInt16LE(centralHeader, 8, 0x0800);
    writeUInt16LE(centralHeader, 10, 0);
    writeUInt16LE(centralHeader, 12, dosTime);
    writeUInt16LE(centralHeader, 14, dosDate);
    writeUInt32LE(centralHeader, 16, crc32);
    writeUInt32LE(centralHeader, 20, entry.data.byteLength);
    writeUInt32LE(centralHeader, 24, entry.data.byteLength);
    writeUInt16LE(centralHeader, 28, nameBuffer.length);
    writeUInt16LE(centralHeader, 30, 0);
    writeUInt16LE(centralHeader, 32, 0);
    writeUInt16LE(centralHeader, 34, 0);
    writeUInt16LE(centralHeader, 36, 0);
    writeUInt32LE(centralHeader, 38, 0);
    writeUInt32LE(centralHeader, 42, offset);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + entry.data.byteLength;
  }

  const centralDirectory = concatUint8Arrays(centralParts);
  const endRecord = new Uint8Array(22);
  writeUInt32LE(endRecord, 0, 0x06054b50);
  writeUInt16LE(endRecord, 4, 0);
  writeUInt16LE(endRecord, 6, 0);
  writeUInt16LE(endRecord, 8, entries.length);
  writeUInt16LE(endRecord, 10, entries.length);
  writeUInt32LE(endRecord, 12, centralDirectory.length);
  writeUInt32LE(endRecord, 16, offset);
  writeUInt16LE(endRecord, 20, 0);

  // Keep MP4 buffers as Blob parts instead of copying the complete archive
  // into one more contiguous allocation, which can exhaust browser memory for
  // large batches.
  return new Blob([...localParts, centralDirectory, endRecord], { type: "application/zip" });
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

function getUniqueFileName(fileName: string, usedNames: Set<string>) {
  const extensionIndex = fileName.lastIndexOf(".");
  const name = extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : "";
  let candidate = fileName;
  let index = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${name}-${index}${extension}`;
    index += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function applyPreparedProjectEdits(project: PreparedProject) {
  const projectName = project.projectName.trim() || "Video project";
  const logoImageUrl = project.logoImageUrl.trim();
  const slogan = project.slogan.trim();
  const [sloganLine1, sloganLine2, sloganLine3] = splitSloganIntoThreeLines(slogan);

  return {
    projectName,
    exportSettings: project.exportSettings,
    scenes: project.sceneTrack.scenes.map((scene, index): Scene => {
      // Make the very first scene 1.5s longer so the intro has more room to
      // breathe, matching the express render output.
      const durationSeconds = index === 0 ? scene.durationSeconds + 1.5 : scene.durationSeconds;

      if (scene.type === "brand-reveal" || scene.type === "brand-reveal-alt" || scene.type === "brand-reveal-circle") {
        return {
          ...scene,
          durationSeconds,
          title: projectName,
          logoImageUrl,
        };
      }

      // Apply the user-edited slogan to the description scene so the preview
      // shows the logical slogan split across three oversized lines.
      if (slogan && scene.type === "description") {
        return {
          ...scene,
          durationSeconds,
          title: sloganLine1 || slogan,
          subtitle: sloganLine2,
          description: sloganLine3,
        };
      }

      // Apply the user-edited slogan to the message scene so the preview
      // slogan is what actually renders in the video.
      if (slogan && (scene.type === "center-text" || scene.type === "slogan")) {
        return {
          ...scene,
          durationSeconds,
          title: slogan,
        };
      }

      return scene.logoImageUrl
        ? {
            ...scene,
            durationSeconds,
            logoImageUrl,
          }
        : {
            ...scene,
            durationSeconds,
          };
    }),
  };
}

async function readRenderError(response: Response) {
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) return payload.error;
    }

    const text = (await response.text()).trim();
    if (text) return text;
  } catch {
    // Keep the generic message below.
  }

  return "Could not generate the video batch.";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    if (typeof Event !== "undefined" && error instanceof Event) {
      const target = error.target;
      if (typeof HTMLImageElement !== "undefined" && target instanceof HTMLImageElement) {
        const source = target.currentSrc || target.src;
        const readableSource = source && !source.startsWith("data:") ? `: ${source}` : "";
        return `Image load failed during scene capture${readableSource}.`;
      }
      return `Browser resource load failed during scene capture (${error.type || "unknown event"}).`;
    }

    const errorLike = error as { name?: unknown; message?: unknown; stack?: unknown; cause?: unknown };
    const name = typeof errorLike.name === "string" ? errorLike.name : "";
    const message = typeof errorLike.message === "string" ? errorLike.message.trim() : "";
    if (message) return name && name !== "Error" ? `${name}: ${message}` : message;

    if (errorLike.cause && errorLike.cause !== error) {
      const causeMessage: string = getErrorMessage(errorLike.cause);
      if (causeMessage && causeMessage !== "Unknown error object.") return causeMessage;
    }

    const ownKeys = Reflect.ownKeys(error).map(String);
    const constructorName = Object.getPrototypeOf(error)?.constructor?.name;
    if (ownKeys.length > 0) return `${name || constructorName || "Error object"} (fields: ${ownKeys.join(", ")})`;
    return `${name || constructorName || "Error object"} without a readable message`;
  }

  return error == null ? "Unknown rendering error." : String(error);
}

function parseUrlLines(value: string) {
  const seen = new Set<string>();

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((url) => {
      const key = url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function ExpressVideoGenerationWorkspace() {
  const [renderMode, setRenderMode] = useState<"server" | "browser">("server");
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState<BatchStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("Waiting for URLs");
  const [downloadHref, setDownloadHref] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState("express-video-generation.zip");
  const [progress, setProgress] = useState<BatchProgress>({
    phase: "idle",
    current: 0,
    total: 0,
    completed: 0,
    currentUrl: null,
    currentFileName: null,
    message: "Waiting for URLs",
  });
  const [projectDrafts, setProjectDrafts] = useState<Record<string, ProjectDraft>>({});
  const [uploadingLogoUrl, setUploadingLogoUrl] = useState<string | null>(null);
  const activeScrapesRef = useRef<Set<string>>(new Set());

  const urls = useMemo(() => parseUrlLines(urlInput), [urlInput]);
  const orderedDrafts = useMemo(() => urls.map((url) => projectDrafts[url]).filter((draft): draft is ProjectDraft => Boolean(draft)), [projectDrafts, urls]);
  const readyProjects = useMemo(
    () => urls.map((url) => projectDrafts[url]?.project ?? null).filter((project): project is PreparedProject => Boolean(project)),
    [projectDrafts, urls],
  );
  const hasPendingPreparation = orderedDrafts.some((draft) => draft.status === "queued" || draft.status === "scraping");
  const hasPreparationError = orderedDrafts.some((draft) => draft.status === "error");
  const isRunning = status === "queued" || status === "scraping" || status === "rendering" || status === "zipping";
  const canGenerate =
    !isRunning &&
    !uploadingLogoUrl &&
    !hasPendingPreparation &&
    !hasPreparationError &&
    urls.length >= 1 &&
    urls.length <= MAX_EXPRESS_BATCH_URLS &&
    readyProjects.length === urls.length;

  const resetDownload = () => {
    setDownloadHref((currentHref) => {
      if (currentHref) URL.revokeObjectURL(currentHref);
      return null;
    });
    setDownloadFileName("express-video-generation.zip");
  };

  const updateFromProgress = (nextProgress: BatchProgress) => {
    setProgress(nextProgress);
    setStatus(nextProgress.phase);
    setStatusMessage(nextProgress.message);
  };

  const handleClear = () => {
    setUrlInput("");
    setStatus("idle");
    setStatusMessage("Waiting for URLs");
    setProgress({
      phase: "idle",
      current: 0,
      total: 0,
      completed: 0,
      currentUrl: null,
      currentFileName: null,
      message: "Waiting for URLs",
    });
    setProjectDrafts({});
    setUploadingLogoUrl(null);
    activeScrapesRef.current.clear();
    resetDownload();
  };

  const updatePreparedProject = (url: string, updater: (project: PreparedProject) => PreparedProject) => {
    setProjectDrafts((currentDrafts) => {
      const draft = currentDrafts[url];
      if (!draft?.project) return currentDrafts;

      return {
        ...currentDrafts,
        [url]: {
          ...draft,
          project: updater(draft.project),
        },
      };
    });
    resetDownload();
  };

  const updateProjectName = (url: string, projectName: string) => {
    updatePreparedProject(url, (project) => ({
      ...project,
      projectName,
    }));
  };

  const updateProjectSlogan = (url: string, slogan: string) => {
    updatePreparedProject(url, (project) => ({
      ...project,
      slogan,
    }));
  };

  const updateProjectLogo = (url: string, logoImageUrl: string) => {
    updatePreparedProject(url, (project) => ({
      ...project,
      logoImageUrl,
    }));
  };

  const handleLogoUpload = async (url: string, file: File | null) => {
    const project = projectDrafts[url]?.project;
    if (!file || !project) return;

    try {
      setUploadingLogoUrl(url);
      const logoImageUrl = await fileToStoredUrl(file, project.exportSettings.resolution, project.exportSettings.profile);
      updateProjectLogo(url, logoImageUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload logo.";
      setProjectDrafts((currentDrafts) => {
        const draft = currentDrafts[url];
        if (!draft) return currentDrafts;

        return {
          ...currentDrafts,
          [url]: {
            ...draft,
            status: "error",
            error: message,
          },
        };
      });
    } finally {
      setUploadingLogoUrl(null);
    }
  };

  const prepareUrl = async (url: string) => {
    if (activeScrapesRef.current.has(url)) return;
    activeScrapesRef.current.add(url);

    setProjectDrafts((currentDrafts) => ({
      ...currentDrafts,
      [url]: {
        url,
        status: "scraping",
        error: null,
        project: currentDrafts[url]?.project ?? null,
      },
    }));

    try {
      const response = await fetch("/api/express-video-generation/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = (await response.json()) as PreparedProject & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not prepare this website.");
      }

      setProjectDrafts((currentDrafts) => {
        if (!currentDrafts[url]) return currentDrafts;

        return {
          ...currentDrafts,
          [url]: {
            url,
            status: "ready",
            error: null,
            project: {
              sourceUrl: payload.sourceUrl || url,
              projectName: payload.projectName,
              slogan: payload.slogan || "",
              logoImageUrl: payload.logoImageUrl,
              sceneTrack: payload.sceneTrack,
              exportSettings: payload.exportSettings,
            },
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not prepare this website.";
      setProjectDrafts((currentDrafts) => {
        if (!currentDrafts[url]) return currentDrafts;

        return {
          ...currentDrafts,
          [url]: {
            url,
            status: "error",
            error: message,
            project: currentDrafts[url]?.project ?? null,
          },
        };
      });
    } finally {
      activeScrapesRef.current.delete(url);
    }
  };

  const handleGenerate = async () => {
    if (urls.length === 0) {
      setStatus("error");
      setStatusMessage("Add at least one website URL.");
      return;
    }

    if (urls.length > MAX_EXPRESS_BATCH_URLS) {
      setStatus("error");
      setStatusMessage(`Use ${MAX_EXPRESS_BATCH_URLS} URLs or fewer per batch.`);
      return;
    }

    if (readyProjects.length !== urls.length) {
      setStatus("error");
      setStatusMessage("Wait until every website is prepared.");
      return;
    }

    let activeFileName: string | null = null;
    let activeStage = "starting batch";

    try {
      resetDownload();
      const files: ZipEntry[] = [];
      const usedNames = new Set<string>();

      for (const [index, project] of readyProjects.entries()) {
        const current = index + 1;
        const renderPayload = applyPreparedProjectEdits(project);
        const fileName = getUniqueFileName(toSafeVideoFileName(renderPayload.projectName), usedNames);
        activeFileName = fileName;

        updateFromProgress({
          phase: "rendering",
          current,
          total: urls.length,
          completed: files.length,
          currentUrl: project.sourceUrl,
          currentFileName: fileName,
          message: `Rendering ${current}/${urls.length}: ${fileName}. Keep this tab open.`,
        });

        if (renderMode === "browser") {
          activeStage = "rendering in this browser";
          const result = await exportSlidesToVideo(
            renderPayload.scenes,
            renderPayload.exportSettings,
            (renderProgress) => {
              const percent = Math.round(renderProgress * 100);
              setStatusMessage(`Rendering ${current}/${urls.length}: ${fileName} (${percent}%) on this device`);
            },
            renderPayload.projectName,
          );
          try {
            activeStage = "adding the rendered video to the ZIP";
            files.push({ name: fileName, data: await result.blob.arrayBuffer() });
          } finally {
            URL.revokeObjectURL(result.url);
          }
        } else {
          activeStage = "requesting server render";
          const response = await fetch("/api/mobile-video/render", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(renderPayload),
          });

          if (!response.ok) {
            throw new Error(await readRenderError(response));
          }

          const videoBuffer = await response.arrayBuffer();
          files.push({ name: fileName, data: videoBuffer });
        }

        updateFromProgress({
          phase: "rendering",
          current,
          total: urls.length,
          completed: files.length,
          currentUrl: project.sourceUrl,
          currentFileName: fileName,
          message: `Done ${files.length}/${urls.length}: ${fileName}`,
        });
      }

      updateFromProgress({
        phase: "zipping",
        current: urls.length,
        total: urls.length,
        completed: files.length,
        currentUrl: null,
        currentFileName: "express-video-generation.zip",
        message: `Preparing ZIP archive with ${files.length} video${files.length === 1 ? "" : "s"}.`,
      });

      activeStage = "building the ZIP archive";
      const archiveBlob = createZipBlob(files);
      const archiveUrl = URL.createObjectURL(archiveBlob);
      setDownloadHref(archiveUrl);
      setDownloadFileName("express-video-generation.zip");
      updateFromProgress({
        phase: "done",
        current: urls.length,
        total: urls.length,
        completed: urls.length,
        currentUrl: null,
        currentFileName: "express-video-generation.zip",
        message: `Done ${urls.length}/${urls.length}. ZIP is ready.`,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const message = activeFileName
        ? `Failed while ${activeStage} for ${activeFileName}: ${errorMessage}`
        : `Failed while ${activeStage}: ${errorMessage}`;
      console.error(`[express-video-generation] ${message}`);
      setStatus("error");
      setStatusMessage(message);
      setProgress((currentProgress) => ({
        ...currentProgress,
        phase: "error",
        message,
      }));
    }
  };

  useEffect(() => {
    setProjectDrafts((currentDrafts) => {
      const currentUrls = Object.keys(currentDrafts);
      const hasSameUrls = currentUrls.length === urls.length && urls.every((url) => Boolean(currentDrafts[url]));
      if (hasSameUrls) return currentDrafts;

      const nextDrafts: Record<string, ProjectDraft> = {};

      for (const url of urls) {
        nextDrafts[url] =
          currentDrafts[url] ?? {
            url,
            status: "queued",
            error: null,
            project: null,
          };
      }

      return nextDrafts;
    });

    if (urls.length === 0 || urls.length > MAX_EXPRESS_BATCH_URLS) return undefined;

    const timer = window.setTimeout(() => {
      for (const url of urls) {
        const draft = projectDrafts[url];
        if (!draft || draft.status === "queued") {
          void prepareUrl(url);
        }
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [urls, projectDrafts]);

  useEffect(() => {
    return () => {
      setDownloadHref((currentHref) => {
        if (currentHref) URL.revokeObjectURL(currentHref);
        return null;
      });
    };
  }, []);

  const progressUnits = progress.total > 0 ? progress.total * 2 + 1 : 1;
  const completedUnits = progress.completed * 2 + (status === "scraping" ? 0.5 : status === "rendering" ? 1 : status === "zipping" || status === "done" ? 1 : 0);
  const progressPercent = status === "done" ? 100 : Math.max(0, Math.min(98, Math.round((completedUnits / progressUnits) * 100)));
  const progressWidth = `${progressPercent}%`;
  const completedUrlCount = status === "done" ? urls.length : Math.min(progress.completed, urls.length);
  const phaseLabel =
    status === "scraping"
      ? "Scraping"
      : status === "rendering"
        ? "Rendering"
        : status === "zipping"
          ? "Preparing ZIP"
          : status === "done"
            ? "Done"
            : status === "queued"
              ? "Queued"
              : status === "error"
                ? "Error"
                : "Idle";

  return (
    <main className="min-h-[calc(100vh-140px)] bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Batch workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Express Video Generation</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Paste 5-{MAX_EXPRESS_BATCH_URLS} website URLs, generate videos, and download the finished MP4 files as one ZIP archive.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-slate-950/30">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Source URLs</h2>
                <p className="mt-1 text-sm text-slate-400">Add one URL per line. Videos are rendered sequentially.</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                {urls.length}/{MAX_EXPRESS_BATCH_URLS} URLs
              </span>
            </div>

            <textarea
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              rows={12}
              disabled={isRunning}
              className="mt-4 w-full resize-y rounded-lg border border-white/10 bg-slate-950/80 px-4 py-3 font-mono text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
              placeholder={`https://example.com\nhttps://startup.example\nhttps://product.example`}
            />

            {urls.length > 0 ? (
              <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-slate-950/55 p-3">
                {urls.map((url, index) => {
                  const draft = projectDrafts[url];
                  const project = draft?.project;
                  const isCompleted = index < completedUrlCount;
                  const isCurrentRender = !isCompleted && isRunning && progress.current === index + 1;
                  const isPreparing = draft?.status === "queued" || draft?.status === "scraping";
                  const statusLabel = isCompleted
                    ? "Video ready"
                    : isCurrentRender
                      ? phaseLabel
                      : draft?.status === "ready"
                        ? "Prepared"
                        : draft?.status === "error"
                          ? "Needs retry"
                          : isPreparing
                            ? "Scraping"
                            : "Waiting";
                  const logoLabel = project?.projectName.trim().charAt(0).toUpperCase() || String(index + 1);

                  return (
                    <details
                      key={`${url}-${index}`}
                      open={draft?.status === "error" || isPreparing || isCurrentRender}
                      className={`rounded-lg border transition ${
                        isCompleted
                          ? "border-emerald-400/25 bg-emerald-400/10"
                          : draft?.status === "error"
                            ? "border-rose-400/25 bg-rose-400/10"
                            : isCurrentRender || isPreparing
                              ? "border-sky-400/25 bg-sky-400/10"
                              : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                            isCompleted
                              ? "border-emerald-300 bg-emerald-400 text-slate-950"
                              : draft?.status === "ready"
                                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                                : draft?.status === "error"
                                  ? "border-rose-300 bg-rose-400/20 text-rose-100"
                                  : "border-sky-300 bg-sky-400/20 text-sky-100"
                          }`}
                          aria-label={statusLabel}
                        >
                          {isCompleted || draft?.status === "ready" ? "\u2713" : index + 1}
                        </span>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-slate-950/80 text-sm font-semibold text-slate-300">
                          {project?.logoImageUrl ? (
                            <img src={project.logoImageUrl} alt={`${project.projectName || "Project"} logo`} className="h-full w-full object-contain" />
                          ) : (
                            <span>{logoLabel}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{project?.projectName || "Preparing project..."}</p>
                          <p className="break-all font-mono text-xs text-slate-500">{url}</p>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-slate-300">{statusLabel}</span>
                      </summary>

                      <div className="border-t border-white/10 px-3 pb-3 pt-3">
                        {draft?.status === "error" ? (
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-rose-200">{draft.error || "Could not prepare this website."}</p>
                            <button
                              type="button"
                              onClick={() => prepareUrl(url)}
                              disabled={activeScrapesRef.current.has(url)}
                              className="rounded-lg border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Retry
                            </button>
                          </div>
                        ) : project ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="block">
                              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Project name</span>
                              <input
                                value={project.projectName}
                                onChange={(event) => updateProjectName(url, event.target.value)}
                                disabled={isRunning}
                                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Slogan</span>
                              <input
                                value={project.slogan}
                                onChange={(event) => updateProjectSlogan(url, event.target.value)}
                                disabled={isRunning}
                                placeholder="Short slogan shown in the video"
                                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Logo URL</span>
                              <input
                                value={project.logoImageUrl}
                                onChange={(event) => updateProjectLogo(url, event.target.value)}
                                disabled={isRunning}
                                placeholder="https://..."
                                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </label>
                            <label className="inline-flex cursor-pointer items-center justify-center self-end rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]">
                              {uploadingLogoUrl === url ? "Uploading..." : "Upload logo"}
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                disabled={isRunning || uploadingLogoUrl === url}
                                onChange={async (event) => {
                                  await handleLogoUpload(url, event.target.files?.[0] ?? null);
                                  event.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        ) : (
                          <p className="text-sm text-sky-100">Scraping website and preparing editable project data...</p>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-medium text-slate-400">Render videos on</span>
              <div role="group" aria-label="Choose where to render express videos" className="inline-flex w-fit items-center gap-1 rounded-lg border border-white/10 bg-slate-950/70 p-1">
                <button
                  type="button"
                  aria-pressed={renderMode === "server"}
                  disabled={isRunning}
                  onClick={() => setRenderMode("server")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${renderMode === "server" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  Server
                </button>
                <button
                  type="button"
                  aria-pressed={renderMode === "browser"}
                  disabled={isRunning}
                  onClick={() => setRenderMode("browser")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${renderMode === "browser" ? "bg-sky-400/20 text-sky-200" : "text-slate-400 hover:text-white"}`}
                >
                  This device
                </button>
              </div>
            </div>
            {renderMode === "browser" ? (
              <p className="mt-2 text-xs leading-5 text-amber-200/75">
                Videos render sequentially in this tab. A batch of 15 may use substantial device memory; keep this tab open until the ZIP is ready.
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={urls.length > MAX_EXPRESS_BATCH_URLS ? "text-xs text-rose-300" : "text-xs text-slate-500"}>
                {urls.length > MAX_EXPRESS_BATCH_URLS
                  ? `Too many URLs. Keep the batch to ${MAX_EXPRESS_BATCH_URLS} or fewer.`
                  : `Limit: ${MAX_EXPRESS_BATCH_URLS} URLs per batch.`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isRunning}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunning ? "Generating..." : hasPendingPreparation ? "Preparing..." : "Generate Videos"}
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-base font-semibold text-white">Batch Status</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Step</p>
                <p className={status === "error" ? "mt-1 text-sm font-medium text-rose-200" : "mt-1 text-sm font-medium text-slate-200"}>
                  {phaseLabel}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Counter</p>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {progress.total > 0 ? `${progress.completed}/${progress.total} videos done` : "0/0 videos done"}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current</p>
                <p className={status === "error" ? "mt-1 break-words text-sm font-medium text-rose-200" : "mt-1 break-words text-sm font-medium text-slate-200"}>
                  {statusMessage}
                </p>
                {progress.currentUrl ? <p className="mt-2 break-all text-xs leading-5 text-slate-500">{progress.currentUrl}</p> : null}
                {progress.currentFileName ? <p className="mt-2 break-all text-xs leading-5 text-sky-300">{progress.currentFileName}</p> : null}
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Progress</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-sky-400 transition-all duration-500 ${isRunning ? "animate-pulse" : ""}`}
                    style={{ width: progressWidth }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">{progressPercent}%</p>
              </div>
              {downloadHref && status === "done" ? (
                <a
                  href={downloadHref}
                  download={downloadFileName}
                  className="block w-full rounded-lg border border-white/30 bg-white px-4 py-2 text-center text-sm font-medium text-slate-950 transition hover:bg-slate-100"
                >
                  Download ZIP
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-500 disabled:cursor-not-allowed"
                >
                  Download ZIP
                </button>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
