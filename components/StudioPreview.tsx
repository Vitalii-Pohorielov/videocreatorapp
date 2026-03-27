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
  isImageUploading: boolean;
  imageUploadLabel: string | null;
  onProjectNameChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onUpdateSettings: (updates: Partial<ExportSettings>) => void;
  onGenerateFromUrl: () => void;
  onSaveProject: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onTogglePlayback: () => void;
  onUpdateScene: (id: string, updates: Partial<Omit<Scene, "id" | "type">>) => void;
  onImageUploadStart: (label: string) => void;
  onImageUploadEnd: () => void;
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
  isImageUploading,
  imageUploadLabel,
  onProjectNameChange,
  onSourceUrlChange,
  onUpdateSettings,
  onGenerateFromUrl,
  onSaveProject,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onTogglePlayback,
  onUpdateScene,
  onImageUploadStart,
  onImageUploadEnd,
}: StudioPreviewProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const profileOptions: ExportProfile[] = ["draft", "standard", "high"];

  const applyImageUpload = async (field: "logoImageUrl" | "websiteImageUrl" | "authorImageUrl", file: File | null) => {
    if (!file) return;
    onImageUploadStart(
      field === "logoImageUrl" ? "Uploading logo..." : field === "websiteImageUrl" ? "Uploading screenshot..." : "Uploading author media...",
    );
    try {
      const imageUrl = await fileToStoredUrl(file, settings.resolution, profile);
      onUpdateScene(scene.id, { [field]: imageUrl });
    } finally {
      onImageUploadEnd();
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col border-b border-white/10">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2 xl:flex-[0_1_auto] xl:flex-nowrap xl:gap-3">
            <Link
              href="/projects"
              aria-label="Open projects"
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-200 transition hover:bg-white/[0.08]"
            >
              <span className="grid grid-cols-2 gap-1" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-[2px] bg-current" />
                <span className="h-2.5 w-2.5 rounded-[2px] bg-current" />
                <span className="h-2.5 w-2.5 rounded-[2px] bg-current" />
                <span className="h-2.5 w-2.5 rounded-[2px] bg-current" />
              </span>
            </Link>
            <input
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-sky-400 sm:min-w-[160px] xl:w-[175px] xl:flex-none"
              placeholder="Project name"
            />
            <button
              type="button"
              onClick={onSaveProject}
              disabled={isCloudBusy}
              className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-60"
            >
              {isCloudBusy ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h9a6 6 0 1 1 0 12h-2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 14 20 9l-5-5" />
                <path d="M20 9h-9a6 6 0 1 0 0 12h2" />
              </svg>
            </button>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2 xl:flex-[0_0_auto] xl:flex-nowrap xl:justify-center">
            <input
              value={sourceUrl}
              onChange={(event) => onSourceUrlChange(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400 sm:min-w-[190px] xl:w-[230px] xl:flex-none"
              placeholder="Paste website URL"
            />
            <button
              type="button"
              onClick={onGenerateFromUrl}
              disabled={isGeneratingFromUrl}
              aria-label={isGeneratingFromUrl ? "Generating" : "Generate from URL"}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/12 text-sky-200 transition hover:bg-sky-400/18 disabled:opacity-60"
            >
              {isGeneratingFromUrl ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-200/30 border-t-sky-200" aria-hidden="true" />
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M8.6 6.8c0-.9 1-1.46 1.78-.98l7.02 4.37c.73.45.73 1.52 0 1.98l-7.02 4.37c-.78.48-1.78-.08-1.78-.98V6.8Z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 xl:flex-[0_1_auto] xl:flex-nowrap xl:justify-end">
            <label className="w-[112px] rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
              <select
                value={settings.profile}
                onChange={(event) => onUpdateSettings({ profile: event.target.value as ExportProfile })}
                className="w-full bg-transparent outline-none"
              >
                {profileOptions.map((option) => (
                  <option key={option} value={option}>
                    {exportProfileLabels[option]}
                  </option>
                ))}
              </select>
            </label>

            {downloadUrl ? (
              <a
                href={downloadUrl}
                download={downloadFileName}
                className="inline-flex w-[116px] items-center justify-center gap-2 rounded-xl border border-white/30 bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ↓
                </span>
                <span>Download</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex w-[116px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-500"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ↓
                </span>
                <span>Download</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className="w-[136px] whitespace-nowrap rounded-xl bg-sky-400 px-3 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
            >
              {isExporting ? `Exporting ${Math.round(exportProgress * 100)}%` : "Export"}
            </button>
          </div>
        </div>
        {isImageUploading ? (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>{imageUploadLabel ?? "Uploading image..."}</span>
              <span className="uppercase tracking-[0.18em] text-sky-300">Working</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
              <div className="relative h-full w-full overflow-hidden rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.45)] [animation:upload-slide_1.1s_linear_infinite]" />
              </div>
            </div>
            <style jsx>{`
              @keyframes upload-slide {
                0% { transform: translateX(-120%); }
                100% { transform: translateX(360%); }
              }
            `}</style>
          </div>
        ) : null}
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
        <div className="flex h-full w-full max-w-6xl flex-col rounded-[28px] border border-white/10 bg-slate-950 shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
          <div className="flex flex-1 items-center justify-center overflow-hidden bg-black">
            <div className="relative aspect-video h-full max-h-full w-full max-w-full overflow-hidden bg-black">
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
