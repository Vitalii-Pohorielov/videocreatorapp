"use client";

import Link from "next/link";
import { useRef } from "react";

import { SceneStage } from "@/components/SceneStage";
import { fileToStoredUrl } from "@/lib/imageUpload";
import {
  exportProfileLabels,
  type ExportProfile,
  type ExportSettings,
  type Scene,
  type TemplatePreset,
} from "@/store/useStore";

type StudioPreviewProps = {
  projectId: string | null;
  projectName: string;
  settings: ExportSettings;
  scene: Scene;
  backgroundColor: string;
  textColor: string;
  preset: TemplatePreset;
  profile: ExportProfile;
  sceneProgress: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  isExporting: boolean;
  exportProgress: number;
  downloadUrl: string | null;
  downloadFileName: string;
  sourceUrl: string;
  isGeneratingFromUrl: boolean;
  cloudStatus: string | null;
  isCloudBusy: boolean;
  onProjectNameChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onUpdateSettings: (updates: Partial<ExportSettings>) => void;
  onGenerateFromUrl: () => void;
  onSaveProject: () => void;
  onExport: () => void;
  onTogglePlayback: () => void;
  onUpdateScene: (id: string, updates: Partial<Omit<Scene, "id" | "type">>) => void;
};

export function StudioPreview({
  projectId,
  projectName,
  settings,
  scene,
  backgroundColor,
  textColor,
  preset,
  profile,
  sceneProgress,
  isPlaying,
  currentTime,
  totalDuration,
  isExporting,
  exportProgress,
  downloadUrl,
  downloadFileName,
  sourceUrl,
  isGeneratingFromUrl,
  cloudStatus,
  isCloudBusy,
  onProjectNameChange,
  onSourceUrlChange,
  onUpdateSettings,
  onGenerateFromUrl,
  onSaveProject,
  onExport,
  onTogglePlayback,
  onUpdateScene,
}: StudioPreviewProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const profileOptions: ExportProfile[] = ["draft", "standard", "high"];

  const applyImageUpload = async (field: "logoImageUrl" | "websiteImageUrl" | "authorImageUrl", file: File | null) => {
    if (!file) return;
    const imageUrl = await fileToStoredUrl(file, settings.resolution, profile);
    onUpdateScene(scene.id, { [field]: imageUrl });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col border-b border-white/10">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.08]">
                Projects
              </Link>
              <input
                value={projectName}
                onChange={(event) => onProjectNameChange(event.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                placeholder="Project name"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={sourceUrl}
                onChange={(event) => onSourceUrlChange(event.target.value)}
                className="min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                placeholder="Paste website URL"
              />

              <button
                type="button"
                onClick={onGenerateFromUrl}
                disabled={isGeneratingFromUrl}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/12 px-4 py-2.5 text-sm font-medium text-sky-200 transition hover:bg-sky-400/18 disabled:opacity-60"
              >
                {isGeneratingFromUrl ? "Generating..." : "Generate"}
              </button>

              <label className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                <select
                  value={settings.profile}
                  onChange={(event) => onUpdateSettings({ profile: event.target.value as ExportProfile })}
                  className="bg-transparent outline-none"
                >
                  {profileOptions.map((option) => (
                    <option key={option} value={option}>
                      {exportProfileLabels[option]}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={onSaveProject}
                disabled={isCloudBusy}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-60"
              >
                {isCloudBusy ? "Saving..." : "Save"}
              </button>

              {downloadUrl ? (
                <a href={downloadUrl} download={downloadFileName} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                  Download
                </a>
              ) : null}

              <button
                type="button"
                onClick={onExport}
                disabled={isExporting}
                className="rounded-2xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
              >
                {isExporting ? `Exporting ${Math.round(exportProgress * 100)}%` : "Export"}
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
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
        <input
          ref={authorInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (event) => {
            await applyImageUpload("authorImageUrl", event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <div className="flex h-full w-full max-w-5xl flex-col rounded-[28px] border border-white/10 bg-slate-950 shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
          <div className="flex flex-1 items-center justify-center overflow-hidden rounded-[24px] bg-black">
            <div className="relative aspect-video h-full max-h-full w-full max-w-full overflow-hidden rounded-[24px] bg-black">
              <div className="absolute inset-0">
                <SceneStage
                  scene={scene}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  preset={preset}
                  performanceMode="light"
                  renderLayer="background"
                  progress={1}
                  uploadResolution={settings.resolution}
                  uploadProfile={profile}
                />
              </div>
              <div className="absolute inset-0">
                <SceneStage
                  scene={scene}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  preset={preset}
                  performanceMode="light"
                  renderLayer="content"
                  progress={sceneProgress}
                  editable={!isPlaying}
                  onSceneChange={(updates) => onUpdateScene(scene.id, updates)}
                  onRequestLogoUpload={() => logoInputRef.current?.click()}
                  onRequestHighlightUpload={() => highlightInputRef.current?.click()}
                  onRequestAuthorUpload={() => authorInputRef.current?.click()}
                  uploadResolution={settings.resolution}
                  uploadProfile={profile}
                />
              </div>
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
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="text-sm text-slate-300">
              {currentTime.toFixed(1)} / {totalDuration.toFixed(1)}s
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
