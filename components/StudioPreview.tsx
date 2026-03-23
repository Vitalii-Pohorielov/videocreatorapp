"use client";

import { useRef } from "react";

import { SceneStage } from "@/components/SceneStage";
import { fileToDataUrl } from "@/lib/imageUpload";
import type { Scene, TemplatePreset } from "@/store/useStore";

type StudioPreviewProps = {
  scene: Scene;
  backgroundColor: string;
  textColor: string;
  preset: TemplatePreset;
  sceneProgress: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onTogglePlayback: () => void;
  onUpdateScene: (id: string, updates: Partial<Omit<Scene, "id" | "type">>) => void;
};

export function StudioPreview({ scene, backgroundColor, textColor, preset, sceneProgress, isPlaying, currentTime, totalDuration, onTogglePlayback, onUpdateScene }: StudioPreviewProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  const applyImageUpload = async (field: "logoImageUrl" | "websiteImageUrl", file: File | null) => {
    if (!file) return;
    const imageUrl = await fileToDataUrl(file);
    onUpdateScene(scene.id, { [field]: imageUrl });
  };

  return (
    <section className="flex min-h-[640px] flex-col border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preview</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Video preview</h2>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">1280 x 720</div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-6">
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
        <div className="w-full max-w-5xl rounded-[32px] border border-slate-200 bg-slate-900 p-4 shadow-sm">
          <div className="relative aspect-video overflow-hidden rounded-[24px] bg-black">
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
            />
            {isPlaying ? (
              <button type="button" onClick={onTogglePlayback} className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-slate-900 shadow-lg transition hover:scale-105">
                II
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-4">
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
