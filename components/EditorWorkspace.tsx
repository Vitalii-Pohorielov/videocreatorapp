"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SceneInspector } from "@/components/SceneInspector";
import { SceneTimeline } from "@/components/SceneTimeline";
import { SceneTypeModal } from "@/components/SceneTypeModal";
import { StudioPreview } from "@/components/StudioPreview";
import { ConfirmModal } from "@/components/ConfirmModal";
import { exportSlidesToVideo } from "@/lib/ffmpeg";
import { loadProject, saveProject } from "@/lib/projectPersistence";
import { createFreeInitialSceneTrack, createScene, freePromoSceneTypes, freeStylePresets } from "@/lib/sceneDefinitions";
import { isAnnouncementScene } from "@/lib/sceneTransitions";
import { usePremiumStatus } from "@/lib/usePremiumStatus";
import { useStore, type ExportSettings, type Scene, type SceneTrack, type SceneType, type VideoType } from "@/store/useStore";

type EditorWorkspaceProps = {
  initialProjectId?: string | null;
  initialVideoType?: VideoType;
};

type WorkspaceSnapshot = {
  projectName: string;
  sceneTrack: SceneTrack;
  exportSettings: ExportSettings;
  selectedSceneId: string;
};

const PREVIEW_FPS = 24;
const PREVIEW_FRAME_SECONDS = 1 / PREVIEW_FPS;

type ExpressCreateEntry = {
  projectName: string;
  slogan: string;
};

function parseExpressCreatePrompt(prompt: string): ExpressCreateEntry[] {
  return prompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("**");
      if (separatorIndex < 0) return null;

      const projectName = line.slice(0, separatorIndex).trim();
      const slogan = line.slice(separatorIndex + 2).trim();
      if (!projectName || !slogan) return null;

      return { projectName, slogan };
    })
    .filter((entry): entry is ExpressCreateEntry => Boolean(entry));
}

export function EditorWorkspace({ initialProjectId = null, initialVideoType = "promo" }: EditorWorkspaceProps) {
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const projectId = useStore((state) => state.projectId);
  const projectName = useStore((state) => state.projectName);
  const sceneTrack = useStore((state) => state.sceneTrack);
  const selectedSceneId = useStore((state) => state.selectedSceneId);
  const exportSettings = useStore((state) => state.exportSettings);
  const resetProject = useStore((state) => state.resetProject);
  const hydrateProject = useStore((state) => state.hydrateProject);
  const updateProjectMeta = useStore((state) => state.updateProjectMeta);
  const addScene = useStore((state) => state.addScene);
  const duplicateScene = useStore((state) => state.duplicateScene);
  const updateScene = useStore((state) => state.updateScene);
  const deleteScene = useStore((state) => state.deleteScene);
  const selectScene = useStore((state) => state.selectScene);
  const reorderScenes = useStore((state) => state.reorderScenes);
  const updateExportSettings = useStore((state) => state.updateExportSettings);
  const restoreWorkspaceState = useStore((state) => state.restoreWorkspaceState);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState("video-project.mp4");
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sourceUrl, setSourceUrl] = useState("");
  const [expressCreatePrompt, setExpressCreatePrompt] = useState("");
  const [isGeneratingFromUrl, setIsGeneratingFromUrl] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isCloudBusy, setIsCloudBusy] = useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
  const [imageUploadCount, setImageUploadCount] = useState(0);
  const [imageUploadLabel, setImageUploadLabel] = useState<string | null>(null);
  const didHydrateProject = useRef<string | null | undefined>(undefined);
  const currentTimeRef = useRef(0);
  const undoStackRef = useRef<WorkspaceSnapshot[]>([]);
  const redoStackRef = useRef<WorkspaceSnapshot[]>([]);
  const lastSavedSignatureRef = useRef<string>("");
  const saveInFlightRef = useRef(false);
  const queuedSaveReasonRef = useRef<"auto" | "manual" | null>(null);

  const scenes = sceneTrack.scenes;
  const isAnnouncementWorkspace = useMemo(
    () =>
      initialVideoType === "announcement" ||
      scenes.some((scene) => scene.type === "announcement-hero" || scene.type === "split-slogan"),
    [initialVideoType, scenes],
  );
  const isFreeMode = !isPremiumLoading && !isPremium;
  const hasAnnouncementTransitions = useMemo(() => scenes.some((scene) => isAnnouncementScene(scene)), [scenes]);
  const selectedScene = useMemo(() => scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0] ?? null, [scenes, selectedSceneId]);
  const totalDuration = useMemo(
    () =>
      scenes.reduce(
        (sum, scene, index) => sum + scene.durationSeconds + (hasAnnouncementTransitions && index < scenes.length - 1 ? exportSettings.transitionSeconds : 0),
        0,
      ),
    [exportSettings.transitionSeconds, hasAnnouncementTransitions, scenes],
  );
  const projectSaveSignature = useMemo(
    () =>
      JSON.stringify({
        projectName,
        sceneTrack,
        exportSettings,
      }),
    [projectName, sceneTrack, exportSettings],
  );
  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;
  const isImageUploading = imageUploadCount > 0;
  const selectedSceneStartTime = useMemo(() => {
    let elapsed = 0;
    for (const [index, scene] of scenes.entries()) {
      if (scene.id === selectedSceneId) return elapsed;
      elapsed += scene.durationSeconds + (hasAnnouncementTransitions && index < scenes.length - 1 ? exportSettings.transitionSeconds : 0);
    }
    return 0;
  }, [exportSettings.transitionSeconds, hasAnnouncementTransitions, scenes, selectedSceneId]);

  const playbackState = useMemo(() => {
    if (!isPlaying) return { scene: selectedScene, progress: 1, nextScene: null, transitionProgress: 0 };
    let elapsed = 0;
    for (const [index, scene] of scenes.entries()) {
      const start = elapsed;
      const stillEnd = elapsed + scene.durationSeconds;
      const nextScene = scenes[index + 1] ?? null;
      const canAnimateTransition = hasAnnouncementTransitions && Boolean(nextScene);
      const transitionEnd = stillEnd + (canAnimateTransition ? exportSettings.transitionSeconds : 0);

      if (currentTime <= stillEnd) {
        return {
          scene,
          progress: scene.durationSeconds > 0 ? Math.min(1, Math.max(0, (currentTime - start) / scene.durationSeconds)) : 1,
          nextScene: null,
          transitionProgress: 0,
        };
      }

      if (canAnimateTransition && nextScene && currentTime <= transitionEnd) {
        return {
          scene,
          progress: 1,
          nextScene,
          transitionProgress:
            exportSettings.transitionSeconds > 0 ? Math.min(1, Math.max(0, (currentTime - stillEnd) / exportSettings.transitionSeconds)) : 1,
        };
      }
      elapsed = transitionEnd;
    }
    return { scene: scenes[scenes.length - 1] ?? selectedScene, progress: 1, nextScene: null, transitionProgress: 0 };
  }, [currentTime, exportSettings.transitionSeconds, hasAnnouncementTransitions, isPlaying, scenes, selectedScene]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    if (!isPlaying) return;
    let frameId = 0;
    let lastTimestamp: number | null = null;
    let accumulatedSeconds = 0;

    const tick = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      const deltaSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      accumulatedSeconds += deltaSeconds;

      if (accumulatedSeconds >= PREVIEW_FRAME_SECONDS) {
        const next = Math.min(totalDuration, currentTimeRef.current + accumulatedSeconds);
        accumulatedSeconds = 0;
        currentTimeRef.current = next;

        startTransition(() => {
          setCurrentTime(next);
        });

        if (next >= totalDuration) {
          setIsPlaying(false);
          return;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!(event.reason instanceof Event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const target = event.reason.target;
      const tagName = target instanceof Element ? target.tagName.toLowerCase() : "unknown";
      const source = target instanceof HTMLImageElement ? target.currentSrc || target.src : target instanceof HTMLSourceElement ? target.src : "";
      console.warn(`Ignored resource loading event from <${tagName}>${source ? `: ${source}` : ""}.`, event.reason);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection, { capture: true });
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection, { capture: true });
  }, []);

  useEffect(() => {
    if (didHydrateProject.current === initialProjectId) return;
    didHydrateProject.current = initialProjectId;

    resetProject(initialVideoType);
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setCloudStatus(initialProjectId ? `Loading project ${initialProjectId}...` : null);
    setIsCloudBusy(Boolean(initialProjectId));
    undoStackRef.current = [];
    redoStackRef.current = [];

    const syncSavedSignature = () => {
      lastSavedSignatureRef.current = JSON.stringify({
        projectName: useStore.getState().projectName,
        sceneTrack: useStore.getState().sceneTrack,
        exportSettings: useStore.getState().exportSettings,
      });
    };

    syncSavedSignature();

    if (!initialProjectId) return;

    loadProject(initialProjectId)
      .then((project) => {
        hydrateProject({
          id: project.id,
          name: project.name,
          sceneTrack: project.payload.sceneTrack,
          exportSettings: project.payload.exportSettings,
        });
        syncSavedSignature();
        setCloudStatus(`Loaded "${project.name}".`);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Could not load project.";
        setCloudStatus(message);
      })
      .finally(() => {
        setIsCloudBusy(false);
      });
  }, [hydrateProject, initialProjectId, initialVideoType, resetProject]);

  useEffect(() => {
    if (isPremiumLoading || !isFreeMode || initialProjectId) return;

    const nextTrack = createFreeInitialSceneTrack();
    restoreWorkspaceState({
      projectName: "Untitled project",
      sceneTrack: nextTrack,
      exportSettings: useStore.getState().exportSettings,
      selectedSceneId: nextTrack.scenes[0]?.id ?? "",
    });
    setCloudStatus("Free mode supports promo videos with Intro, Highlight, and Features scenes only.");
  }, [initialProjectId, isFreeMode, isPremiumLoading, restoreWorkspaceState]);

  useEffect(() => {
    if (isPremiumLoading || !isFreeMode || isAnnouncementWorkspace) return;
    if (freeStylePresets.includes(exportSettings.preset)) return;

    updateExportSettings({ preset: "black" });
    setCloudStatus("Free mode supports the Black and White style presets only.");
  }, [exportSettings.preset, isAnnouncementWorkspace, isFreeMode, isPremiumLoading, updateExportSettings]);

  const resetDownload = useCallback(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  }, [downloadUrl]);

  const captureSnapshot = useCallback(
    (): WorkspaceSnapshot => ({
      projectName,
      sceneTrack,
      exportSettings,
      selectedSceneId,
    }),
    [exportSettings, projectName, sceneTrack, selectedSceneId],
  );

  const syncSavedSignature = useCallback(() => {
    lastSavedSignatureRef.current = JSON.stringify({
      projectName: useStore.getState().projectName,
      sceneTrack: useStore.getState().sceneTrack,
      exportSettings: useStore.getState().exportSettings,
    });
  }, []);

  const saveCurrentProject = useCallback(
    async (reason: "auto" | "manual") => {
      if (saveInFlightRef.current) {
        queuedSaveReasonRef.current = queuedSaveReasonRef.current === "manual" || reason === "manual" ? "manual" : "auto";
        return;
      }

      saveInFlightRef.current = true;
      try {
        const current = useStore.getState();
        const currentSignature = JSON.stringify({
          projectName: current.projectName,
          sceneTrack: current.sceneTrack,
          exportSettings: current.exportSettings,
        });

        if (reason === "auto" && currentSignature === lastSavedSignatureRef.current) {
          return;
        }

        if (reason === "manual") {
          setIsCloudBusy(true);
          setCloudStatus("Saving project...");
        }

        const project = await saveProject({
          projectId: current.projectId,
          projectName: current.projectName,
          sceneTrack: current.sceneTrack,
          exportSettings: current.exportSettings,
        });

        updateProjectMeta({ id: project.id, name: project.name });
        syncSavedSignature();
        window.history.replaceState({}, "", `/editor?project=${project.id}`);

        if (reason === "manual") {
          setCloudStatus(`Saved "${project.name}".`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save project.";
        setCloudStatus(message);
      } finally {
        saveInFlightRef.current = false;
        if (reason === "manual") {
          setIsCloudBusy(false);
        }

        const queuedReason = queuedSaveReasonRef.current;
        queuedSaveReasonRef.current = null;
        if (queuedReason) {
          void saveCurrentProject(queuedReason);
        }
      }
    },
    [syncSavedSignature, updateProjectMeta],
  );

  useEffect(() => {
    const trimmedSignature = projectSaveSignature;
    if (trimmedSignature === lastSavedSignatureRef.current) return;

    const timeoutId = window.setTimeout(() => {
      void saveCurrentProject("auto");
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [projectSaveSignature, saveCurrentProject]);

  const pushHistorySnapshot = useCallback(() => {
    undoStackRef.current.push(captureSnapshot());
    redoStackRef.current = [];
  }, [captureSnapshot]);

  const applySnapshot = useCallback(
    (snapshot: WorkspaceSnapshot) => {
      restoreWorkspaceState(snapshot);
      setIsPlaying(false);
      resetDownload();
      let elapsed = 0;
      for (const [index, timelineScene] of snapshot.sceneTrack.scenes.entries()) {
        if (timelineScene.id === snapshot.selectedSceneId) break;
        elapsed +=
          timelineScene.durationSeconds +
          (snapshot.sceneTrack.scenes.some((scene) => isAnnouncementScene(scene)) && index < snapshot.sceneTrack.scenes.length - 1
            ? snapshot.exportSettings.transitionSeconds
            : 0);
      }
      currentTimeRef.current = elapsed;
      setCurrentTime(elapsed);
    },
    [resetDownload, restoreWorkspaceState],
  );

  const handleUndo = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push(captureSnapshot());
    applySnapshot(previous);
  }, [applySnapshot, captureSnapshot]);

  const handleRedo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(captureSnapshot());
    applySnapshot(next);
  }, [applySnapshot, captureSnapshot]);

  const handleExport = async () => {
    if (scenes.length === 0) {
      setCloudStatus("Add at least one scene before export.");
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      resetDownload();
      const result = await exportSlidesToVideo(scenes, exportSettings, setExportProgress, projectName);
      setDownloadUrl(result.url);
      setDownloadFileName(result.fileName);
    } finally {
      setIsExporting(false);
    }
  };

  const runGenerateFromUrl = async () => {
    const trimmedUrl = sourceUrl.trim();
    if (!trimmedUrl) {
      setCloudStatus("Add a website URL first.");
      return;
    }

    try {
      setIsGeneratingFromUrl(true);
      setCloudStatus("Reading website and building scenes...");
      setIsPlaying(false);
      currentTimeRef.current = 0;
      setCurrentTime(0);
      resetDownload();
      undoStackRef.current = [];
      redoStackRef.current = [];

      const response = await fetch("/api/generate-from-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const payload = (await response.json()) as {
        error?: string;
        projectName?: string;
        sceneTrack?: typeof sceneTrack;
        exportSettings?: typeof exportSettings;
      };

      if (!response.ok || !payload.projectName || !payload.sceneTrack || !payload.exportSettings) {
        throw new Error(payload.error || "Could not generate scenes from that URL.");
      }

      hydrateProject({
        id: null,
        name: payload.projectName,
        sceneTrack: payload.sceneTrack,
        exportSettings: payload.exportSettings,
      });
      window.history.replaceState({}, "", "/editor");
      setCloudStatus(`Generated draft from ${trimmedUrl}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate scenes from that URL.";
      setCloudStatus(message);
    } finally {
      setIsGeneratingFromUrl(false);
    }
  };

  const handleGenerateFromUrl = useCallback(() => {
    const trimmedUrl = sourceUrl.trim();
    if (!trimmedUrl) {
      setCloudStatus("Add a website URL first.");
      return;
    }

    setIsGenerateConfirmOpen(true);
  }, [sourceUrl]);

  const handleExpressCreate = useCallback(() => {
    const trimmedPrompt = expressCreatePrompt.trim();
    if (!trimmedPrompt) {
      setCloudStatus("Add text for express creation first.");
      return;
    }

    const entries = parseExpressCreatePrompt(trimmedPrompt);
    if (entries.length === 0) {
      setCloudStatus("Use one line per scene in the format Name**Slogan.");
      return;
    }

    const currentScenes = useStore.getState().sceneTrack.scenes;
    const announcementHero =
      currentScenes.find((scene) => scene.type === "announcement-hero") ??
      createScene("announcement-hero", 0);

    const splitSloganScenes = entries.map((entry, index) => {
      const scene = createScene("split-slogan", index + 1);
      return {
        ...scene,
        subtitle: entry.projectName,
        title: entry.slogan,
        name: `${entry.projectName} slogan`,
      };
    });

    const nextScenes = [announcementHero, ...splitSloganScenes];
    const nextSceneTrack: SceneTrack = {
      id: "main-track",
      name: sceneTrack.name,
      scenes: nextScenes,
    };

    pushHistorySnapshot();
    resetDownload();
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    restoreWorkspaceState({
      projectName,
      sceneTrack: nextSceneTrack,
      exportSettings,
      selectedSceneId: nextScenes[0]?.id ?? "",
    });
    redoStackRef.current = [];
    setCloudStatus(`Created ${splitSloganScenes.length} announcement scenes.`);
  }, [expressCreatePrompt, exportSettings, projectName, pushHistorySnapshot, resetDownload, restoreWorkspaceState, sceneTrack.name]);

  const togglePlayback = useCallback(() => {
    if (!selectedScene || totalDuration <= 0) return;
    setIsPlaying((prev) => {
      if (prev) return false;
      currentTimeRef.current = selectedSceneStartTime;
      setCurrentTime(selectedSceneStartTime);
      return true;
    });
  }, [selectedScene, selectedSceneStartTime, totalDuration]);

  const handlePreviewSceneUpdate = useCallback(
    (id: string, updates: Partial<Omit<Scene, "id" | "type">>) => {
      pushHistorySnapshot();
      resetDownload();
      updateScene(id, updates);
    },
    [pushHistorySnapshot, resetDownload, updateScene],
  );

  const handleProjectNameChange = useCallback(
    (value: string) => {
      pushHistorySnapshot();
      updateProjectMeta({ name: value });
    },
    [pushHistorySnapshot, updateProjectMeta],
  );

  const handleExportSettingsUpdate = useCallback(
    (updates: Parameters<typeof updateExportSettings>[0]) => {
      if (isFreeMode && updates.preset && !freeStylePresets.includes(updates.preset)) {
        setCloudStatus("Free mode supports the Black and White style presets only.");
        return;
      }
      pushHistorySnapshot();
      updateExportSettings(updates);
    },
    [isFreeMode, pushHistorySnapshot, updateExportSettings],
  );

  const handleInspectorSceneUpdate = useCallback(
    (id: string, updates: Partial<Omit<Scene, "id" | "type">>) => {
      pushHistorySnapshot();
      resetDownload();
      updateScene(id, updates);
    },
    [pushHistorySnapshot, resetDownload, updateScene],
  );

  const handleTimelineSelect = useCallback(
    (id: string) => {
      setIsPlaying(false);
      selectScene(id);
      let elapsed = 0;
      for (const [index, timelineScene] of sceneTrack.scenes.entries()) {
        if (timelineScene.id === id) break;
        elapsed += timelineScene.durationSeconds + (hasAnnouncementTransitions && index < sceneTrack.scenes.length - 1 ? exportSettings.transitionSeconds : 0);
      }
      currentTimeRef.current = elapsed;
      setCurrentTime(elapsed);
    },
    [exportSettings.transitionSeconds, hasAnnouncementTransitions, sceneTrack.scenes, selectScene],
  );

  const handleTimelineDelete = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      resetDownload();
      deleteScene(id);
    },
    [deleteScene, pushHistorySnapshot, resetDownload],
  );

  const handleTimelineDuplicate = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      resetDownload();
      duplicateScene(id);
    },
    [duplicateScene, pushHistorySnapshot, resetDownload],
  );

  const handleTimelineReorder = useCallback(
    (fromId: string, toId: string) => {
      pushHistorySnapshot();
      reorderScenes(fromId, toId);
    },
    [pushHistorySnapshot, reorderScenes],
  );

  const handleSceneTypeSelect = useCallback(
    (type: SceneType) => {
      if (isFreeMode && !freePromoSceneTypes.includes(type)) {
        setCloudStatus("Free mode supports Intro, Highlight, and Features scenes only.");
        setIsSceneModalOpen(false);
        return;
      }
      pushHistorySnapshot();
      addScene(type);
      setIsSceneModalOpen(false);
      resetDownload();
    },
    [addScene, isFreeMode, pushHistorySnapshot, resetDownload],
  );

  const handleOpenSceneModal = useCallback(() => {
    setIsSceneModalOpen(true);
  }, []);

  const handleSaveProject = async () => {
    void saveCurrentProject("manual");
  };

  const startImageUpload = useCallback((label: string) => {
    setImageUploadCount((current) => current + 1);
    setImageUploadLabel(label);
  }, []);

  const finishImageUpload = useCallback(() => {
    setImageUploadCount((current) => {
      const nextCount = Math.max(0, current - 1);
      if (nextCount === 0) setImageUploadLabel(null);
      return nextCount;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        Boolean(target?.closest("[contenteditable='true']")) ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (isEditableTarget) return;

      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) handleRedo();
        else handleUndo();
      } else if (key === "y") {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleUndo]);

  return (
    <main className="h-[calc(100vh-72px)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_26%),linear-gradient(180deg,#060b16_0%,#0b1220_42%,#0f172a_100%)] px-4 py-4 text-slate-100">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col">
        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-[0_16px_40px_rgba(2,6,23,0.35)] backdrop-blur">
            <StudioPreview
              projectId={projectId}
              projectName={projectName}
              isAnnouncementWorkspace={isAnnouncementWorkspace}
              settings={exportSettings}
              scene={playbackState.scene ?? null}
              backgroundColor={exportSettings.backgroundColor}
              textColor={exportSettings.textColor}
              preset={exportSettings.preset}
              profile={exportSettings.profile}
              sceneProgress={playbackState.progress}
              transitionScene={playbackState.nextScene}
              transitionProgress={playbackState.transitionProgress}
              isPlaying={isPlaying}
              currentTime={currentTime}
              totalDuration={totalDuration}
              isExporting={isExporting}
              exportProgress={exportProgress}
              downloadUrl={downloadUrl}
              downloadFileName={downloadFileName}
              sourceUrl={sourceUrl}
              expressCreatePrompt={expressCreatePrompt}
              isGeneratingFromUrl={isGeneratingFromUrl}
              cloudStatus={cloudStatus}
              isCloudBusy={isCloudBusy}
              isImageUploading={isImageUploading}
              imageUploadLabel={imageUploadLabel}
              onProjectNameChange={handleProjectNameChange}
              onSourceUrlChange={setSourceUrl}
              onExpressCreatePromptChange={setExpressCreatePrompt}
              onUpdateSettings={handleExportSettingsUpdate}
              onGenerateFromUrl={handleGenerateFromUrl}
              onExpressCreate={handleExpressCreate}
              onSaveProject={handleSaveProject}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              onExport={handleExport}
              onTogglePlayback={togglePlayback}
              onUpdateScene={handlePreviewSceneUpdate}
              onImageUploadStart={startImageUpload}
              onImageUploadEnd={finishImageUpload}
            />
            <SceneTimeline
              track={sceneTrack}
              selectedSceneId={selectedScene?.id ?? ""}
              onSelect={handleTimelineSelect}
              onDelete={handleTimelineDelete}
              onDuplicate={handleTimelineDuplicate}
              onAddScene={handleOpenSceneModal}
              onReorder={handleTimelineReorder}
            />
          </div>

          <SceneInspector
            scene={selectedScene}
            settings={exportSettings}
            isAnnouncementWorkspace={isAnnouncementWorkspace}
            onUpdate={handleInspectorSceneUpdate}
            onUpdateSettings={handleExportSettingsUpdate}
            onImageUploadStart={startImageUpload}
            onImageUploadEnd={finishImageUpload}
          />
        </section>
      </div>

      <SceneTypeModal
        isOpen={isSceneModalOpen}
        isAnnouncementWorkspace={isAnnouncementWorkspace}
        onClose={() => setIsSceneModalOpen(false)}
        onSelect={handleSceneTypeSelect}
      />
      <ConfirmModal
        isOpen={isGenerateConfirmOpen}
        title="Replace current draft?"
        description="Generate a new scene draft from this website. Unsaved editor changes will be replaced."
        confirmLabel="Generate draft"
        cancelLabel="Keep current"
        isBusy={isGeneratingFromUrl}
        onClose={() => setIsGenerateConfirmOpen(false)}
        onConfirm={() => {
          setIsGenerateConfirmOpen(false);
          void runGenerateFromUrl();
        }}
      />
    </main>
  );
}
