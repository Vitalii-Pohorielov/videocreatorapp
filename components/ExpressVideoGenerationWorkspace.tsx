"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { fileToStoredUrl } from "@/lib/imageUpload";
import type { ExportSettings, SceneTrack } from "@/lib/sceneDefinitions";

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
    urls.length <= 10 &&
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

    if (urls.length > 10) {
      setStatus("error");
      setStatusMessage("Use 10 URLs or fewer per batch.");
      return;
    }

    if (readyProjects.length !== urls.length) {
      setStatus("error");
      setStatusMessage("Wait until every website is prepared.");
      return;
    }

    try {
      resetDownload();
      updateFromProgress({
        phase: "rendering",
        current: 0,
        total: urls.length,
        completed: 0,
        currentUrl: null,
        currentFileName: null,
        message: `Rendering ${urls.length} prepared project${urls.length === 1 ? "" : "s"}. Keep this tab open.`,
      });

      const response = await fetch("/api/express-video-generation/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projects: readyProjects }),
      });

      if (!response.ok) {
        let message = "Could not generate the video batch.";

        try {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const payload = (await response.json()) as { error?: string };
            if (payload.error) message = payload.error;
          } else {
            const text = (await response.text()).trim();
            if (text) message = text;
          }
        } catch {
          // Keep the generic message.
        }

        throw new Error(message);
      }

      const archiveBlob = await response.blob();
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
      const message = error instanceof Error ? error.message : "Could not generate the video batch.";
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

    if (urls.length === 0 || urls.length > 10) return undefined;

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
            Paste 5-10 website URLs, generate videos, and download the finished MP4 files as one ZIP archive.
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
                {urls.length}/10 URLs
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
                          {isCompleted || draft?.status === "ready" ? "✓" : index + 1}
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
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
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
                              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Logo URL</span>
                              <input
                                value={project.logoImageUrl}
                                onChange={(event) => updateProjectLogo(url, event.target.value)}
                                disabled={isRunning}
                                placeholder="https://..."
                                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </label>
                            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]">
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

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={urls.length > 10 ? "text-xs text-rose-300" : "text-xs text-slate-500"}>
                {urls.length > 10 ? "Too many URLs. Keep the batch to 10 or fewer." : "Limit: 10 URLs per batch."}
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
