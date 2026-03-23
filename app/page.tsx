"use client";

import { useEffect, useMemo, useState } from "react";

import { SceneInspector } from "@/components/SceneInspector";
import { SceneTimeline } from "@/components/SceneTimeline";
import { SceneTypeModal } from "@/components/SceneTypeModal";
import { StudioPreview } from "@/components/StudioPreview";
import { TopBar } from "@/components/TopBar";
import { exportSlidesToVideo } from "@/lib/ffmpeg";
import { useStore } from "@/store/useStore";

export default function HomePage() {
  const { sceneTrack, selectedSceneId, exportSettings, addScene, updateScene, deleteScene, selectScene, reorderScenes, updateExportSettings } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const scenes = sceneTrack.scenes;
  const selectedScene = useMemo(() => scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0], [scenes, selectedSceneId]);
  const totalDuration = useMemo(() => scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0), [scenes]);

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
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(interval);
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
      const result = await exportSlidesToVideo(scenes, exportSettings, setExportProgress);
      setDownloadUrl(result.url);
    } finally {
      setIsExporting(false);
    }
  };

  const togglePlayback = () => {
    setIsPlaying((prev) => {
      if (prev) return false;
      setCurrentTime(0);
      return true;
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-4 py-4 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <TopBar settings={exportSettings} isExporting={isExporting} exportProgress={exportProgress} downloadUrl={downloadUrl} onUpdateSettings={updateExportSettings} onExport={handleExport} />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <StudioPreview scene={playbackState.scene} backgroundColor={exportSettings.backgroundColor} textColor={exportSettings.textColor} preset={exportSettings.preset} resolution={exportSettings.resolution} profile={exportSettings.profile} sceneProgress={playbackState.progress} isPlaying={isPlaying} currentTime={currentTime} totalDuration={totalDuration} onTogglePlayback={togglePlayback} onUpdateScene={(id, updates) => { resetDownload(); updateScene(id, updates); }} />
            <SceneTimeline track={sceneTrack} selectedSceneId={selectedScene.id} backgroundColor={exportSettings.backgroundColor} textColor={exportSettings.textColor} preset={exportSettings.preset} onSelect={(id) => { setIsPlaying(false); setCurrentTime(0); selectScene(id); }} onDelete={(id) => { resetDownload(); deleteScene(id); }} onAddScene={() => setIsSceneModalOpen(true)} onReorder={reorderScenes} />
          </div>

          <SceneInspector scene={selectedScene} settings={exportSettings} onUpdate={(id, updates) => { resetDownload(); updateScene(id, updates); }} onUpdateSettings={updateExportSettings} />
        </section>
      </div>

      <SceneTypeModal isOpen={isSceneModalOpen} onClose={() => setIsSceneModalOpen(false)} onSelect={(type) => { addScene(type); setIsSceneModalOpen(false); resetDownload(); }} />
    </main>
  );
}
