"use client";

import { useRef } from "react";

import { SceneStage } from "@/components/SceneStage";
import { fileToOptimizedDataUrl } from "@/lib/imageUpload";
import { exportResolutionDimensions, exportResolutionLabels, type ExportProfile, type ExportResolution, type Scene, type TemplatePreset } from "@/store/useStore";

type StudioPreviewProps = {
  scene: Scene;
  backgroundColor: string;
  textColor: string;
  preset: TemplatePreset;
  resolution: ExportResolution;
  profile: ExportProfile;
  sceneProgress: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onTogglePlayback: () => void;
  onUpdateScene: (id: string, updates: Partial<Omit<Scene, "id" | "type">>) => void;
};

export function StudioPreview({ scene, backgroundColor, textColor, preset, resolution, profile, sceneProgress, isPlaying, currentTime, totalDuration, onTogglePlayback, onUpdateScene }: StudioPreviewProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const resolutionMeta = exportResolutionDimensions[resolution];

  const applyImageUpload = async (field: "logoImageUrl" | "websiteImageUrl", file: File | null) => {
    if (!file) return;
    const imageUrl = await fileToOptimizedDataUrl(file, resolution, profile);
    onUpdateScene(scene.id, { [field]: imageUrl });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col border-b border-slate-200">
      <div className="flex shrink-0 items-center justify-between px-4 py-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preview</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Video preview</h2>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">{resolutionMeta.width} x {resolutionMeta.height} ({exportResolutionLabels[resolution]})</div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-2">
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (event) => {
            await applyImageUpload("logoImageUrl", event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <input
          ref={highlightInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (event) => {
            await applyImageUpload("websiteImageUrl", event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <div className="flex h-full w-full max-w-5xl flex-col rounded-[28px] border border-slate-200 bg-slate-900 p-2 shadow-sm">
          <div className="flex flex-1 items-center justify-center overflow-hidden rounded-[24px] bg-black">
            <div className="relative aspect-video h-full max-h-full w-auto max-w-[82%] overflow-hidden rounded-[24px] bg-black">
              <SceneStage
                scene={scene}
                backgroundColor={backgroundColor}
                textColor={textColor}
                preset={preset}
                progress={sceneProgress}
                editable={!isPlaying}
                onSceneChange={(updates) => onUpdateScene(scene.id, updates)}
                onRequestLogoUpload={() => logoInputRef.current?.click()}
                onRequestHighlightUpload={() => highlightInputRef.current?.click()}
                uploadResolution={resolution}
                uploadProfile={profile}
              />
              {isPlaying ? (
                <button type="button" onClick={onTogglePlayback} className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-slate-900 shadow-lg transition hover:scale-105">
                  II
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex shrink-0 items-center gap-3">
            <button type="button" onClick={onTogglePlayback} className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
              {isPlaying ? "Pause" : "Play"}
            </button>
            <div className="flex-1"><div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }} /></div></div>
            <div className="text-sm text-slate-300">{currentTime.toFixed(1)} / {totalDuration.toFixed(1)}s</div>
          </div>
        </div>
      </div>
    </section>
  );
}
