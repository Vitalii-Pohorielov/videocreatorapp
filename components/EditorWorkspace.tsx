"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { SceneInspector } from "@/components/SceneInspector";
import { SceneTimeline } from "@/components/SceneTimeline";
import { SceneTypeModal } from "@/components/SceneTypeModal";
import { StudioPreview } from "@/components/StudioPreview";
import { exportSlidesToVideo } from "@/lib/ffmpeg";
import { loadProject, saveProject } from "@/lib/projectPersistence";
import { useStore } from "@/store/useStore";

type EditorWorkspaceProps = {
  initialProjectId?: string | null;
};

const PREVIEW_FPS = 24;
const PREVIEW_FRAME_SECONDS = 1 / PREVIEW_FPS;

export function EditorWorkspace({ initialProjectId = null }: EditorWorkspaceProps) {
  const {
    projectId,
    projectName,
    sceneTrack,
    selectedSceneId,
    exportSettings,
    resetProject,
    hydrateProject,
    updateProjectMeta,
    addScene,
    duplicateScene,
    updateScene,
    deleteScene,
    selectScene,
    reorderScenes,
    updateExportSettings,
  } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState("video-project.mp4");
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sourceUrl, setSourceUrl] = useState("");
  const [isGeneratingFromUrl, setIsGeneratingFromUrl] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isCloudBusy, setIsCloudBusy] = useState(false);
  const didHydrateProject = useRef<string | null | undefined>(undefined);
  const currentTimeRef = useRef(0);

  const scenes = sceneTrack.scenes;
  const selectedScene = useMemo(() => scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0], [scenes, selectedSceneId]);
  const totalDuration = useMemo(() => scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0), [scenes]);
  const selectedSceneStartTime = useMemo(() => {
    let elapsed = 0;
    for (const scene of scenes) {
      if (scene.id === selectedSceneId) return elapsed;
      elapsed += scene.durationSeconds;
    }
    return 0;
  }, [scenes, selectedSceneId]);

  const playbackState = useMemo(() => {
    if (!isPlaying) return { scene: selectedScene, progress: 1 };
    let elapsed = 0;
    for (const scene of scenes) {
      const start = elapsed;
      const end = elapsed + scene.durationSeconds;
      if (currentTime <= end) {
        return { scene, progress: scene.durationSeconds > 0 ? Math.min(1, Math.max(0, (currentTime - start) / scene.durationSeconds)) : 1 };
      }
      elapsed = end;
    }
    return { scene: scenes[scenes.length - 1] ?? selectedScene, progress: 1 };
  }, [currentTime, isPlaying, scenes, selectedScene]);

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
      const target = event.reason.target;
      const tagName = target instanceof Element ? target.tagName.toLowerCase() : "unknown";
      const source = target instanceof HTMLImageElement ? target.currentSrc || target.src : target instanceof HTMLSourceElement ? target.src : "";
      console.warn(`Ignored resource loading event from <${tagName}>${source ? `: ${source}` : ""}.`, event.reason);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  useEffect(() => {
    if (didHydrateProject.current === initialProjectId) return;
    didHydrateProject.current = initialProjectId;

    resetProject();
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setCloudStatus(initialProjectId ? `Loading project ${initialProjectId}...` : null);
    setIsCloudBusy(Boolean(initialProjectId));

    if (!initialProjectId) return;

    loadProject(initialProjectId)
      .then((project) => {
        hydrateProject({
          id: project.id,
          name: project.name,
          sceneTrack: project.payload.sceneTrack,
          exportSettings: project.payload.exportSettings,
        });
        setCloudStatus(`Loaded "${project.name}".`);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Could not load project.";
        setCloudStatus(message);
      })
      .finally(() => {
        setIsCloudBusy(false);
      });
  }, [hydrateProject, initialProjectId, resetProject]);

  const resetDownload = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleExport = async () => {
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

  const handleGenerateFromUrl = async () => {
    const trimmedUrl = sourceUrl.trim();
    if (!trimmedUrl) {
      setCloudStatus("Add a website URL first.");
      return;
    }

    const shouldReplace = window.confirm("Generate a new scene draft from this website? Unsaved editor changes will be replaced.");
    if (!shouldReplace) return;

    try {
      setIsGeneratingFromUrl(true);
      setCloudStatus("Reading website and building scenes...");
      setIsPlaying(false);
      currentTimeRef.current = 0;
      setCurrentTime(0);
      resetDownload();

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

  const togglePlayback = () => {
    setIsPlaying((prev) => {
      if (prev) return false;
      currentTimeRef.current = selectedSceneStartTime;
      setCurrentTime(selectedSceneStartTime);
      return true;
    });
  };

  const handleSaveProject = async () => {
    try {
      setIsCloudBusy(true);
      setCloudStatus("Saving project...");
      const project = await saveProject({
        projectId,
        projectName,
        sceneTrack,
        exportSettings,
      });
      updateProjectMeta({ id: project.id, name: project.name });
      window.history.replaceState({}, "", `/editor?project=${project.id}`);
      setCloudStatus(`Saved "${project.name}".`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save project.";
      setCloudStatus(message);
    } finally {
      setIsCloudBusy(false);
    }
  };

  return (
    <main className="h-[calc(100vh-72px)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_26%),linear-gradient(180deg,#060b16_0%,#0b1220_42%,#0f172a_100%)] px-4 py-4 text-slate-100">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col">
        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-[0_16px_40px_rgba(2,6,23,0.35)] backdrop-blur">
            <StudioPreview
              projectId={projectId}
              projectName={projectName}
              settings={exportSettings}
              scene={playbackState.scene}
              backgroundColor={exportSettings.backgroundColor}
              textColor={exportSettings.textColor}
              preset={exportSettings.preset}
              profile={exportSettings.profile}
              sceneProgress={playbackState.progress}
              isPlaying={isPlaying}
              currentTime={currentTime}
              totalDuration={totalDuration}
              isExporting={isExporting}
              exportProgress={exportProgress}
              downloadUrl={downloadUrl}
              downloadFileName={downloadFileName}
              sourceUrl={sourceUrl}
              isGeneratingFromUrl={isGeneratingFromUrl}
              cloudStatus={cloudStatus}
              isCloudBusy={isCloudBusy}
              onProjectNameChange={(value) => updateProjectMeta({ name: value })}
              onSourceUrlChange={setSourceUrl}
              onUpdateSettings={updateExportSettings}
              onGenerateFromUrl={handleGenerateFromUrl}
              onSaveProject={handleSaveProject}
              onExport={handleExport}
              onTogglePlayback={togglePlayback}
              onUpdateScene={(id, updates) => {
                resetDownload();
                updateScene(id, updates);
              }}
            />
            <SceneTimeline
              track={sceneTrack}
              selectedSceneId={selectedScene.id}
              onSelect={(id) => {
                setIsPlaying(false);
                selectScene(id);
                let elapsed = 0;
                for (const scene of sceneTrack.scenes) {
                  if (scene.id === id) break;
                  elapsed += scene.durationSeconds;
                }
                currentTimeRef.current = elapsed;
                setCurrentTime(elapsed);
              }}
              onDelete={(id) => {
                resetDownload();
                deleteScene(id);
              }}
              onDuplicate={(id) => {
                resetDownload();
                duplicateScene(id);
              }}
              onAddScene={() => setIsSceneModalOpen(true)}
              onReorder={reorderScenes}
            />
          </div>

          <SceneInspector
            scene={selectedScene}
            settings={exportSettings}
            onUpdate={(id, updates) => {
              resetDownload();
              updateScene(id, updates);
            }}
            onUpdateSettings={updateExportSettings}
          />
        </section>
      </div>

      <SceneTypeModal
        isOpen={isSceneModalOpen}
        onClose={() => setIsSceneModalOpen(false)}
        onSelect={(type) => {
          addScene(type);
          setIsSceneModalOpen(false);
          resetDownload();
        }}
      />
    </main>
  );
}
