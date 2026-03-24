"use client";

import Link from "next/link";
import { useRef } from "react";

import { SceneStage } from "@/components/SceneStage";
import { fileToStoredUrl } from "@/lib/imageUpload";
import {
  exportProfileLabels,
  exportResolutionDimensions,
  exportResolutionLabels,
  type ExportProfile,
  type ExportResolution,
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
  resolution: ExportResolution;
  profile: ExportProfile;
  sceneProgress: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  isExporting: boolean;
  exportProgress: number;
  downloadUrl: string | null;
  cloudStatus: string | null;
  isCloudBusy: boolean;
  onProjectNameChange: (value: string) => void;
  onUpdateSettings: (updates: Partial<ExportSettings>) => void;
  onSaveProject: () => void;
  onCopyProjectLink: () => void;
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
  resolution,
  profile,
  sceneProgress,
  isPlaying,
  currentTime,
  totalDuration,
  isExporting,
  exportProgress,
  downloadUrl,
  cloudStatus,
  isCloudBusy,
  onProjectNameChange,
  onUpdateSettings,
  onSaveProject,
  onCopyProjectLink,
  onExport,
  onTogglePlayback,
  onUpdateScene,
}: StudioPreviewProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const resolutionMeta = exportResolutionDimensions[resolution];
  const resolutionOptions: ExportResolution[] = ["480p", "540p", "720p"];
  const profileOptions: ExportProfile[] = ["draft", "standard", "high"];

  const applyImageUpload = async (field: "logoImageUrl" | "websiteImageUrl", file: File | null) => {
    if (!file) return;
    const imageUrl = await fileToStoredUrl(file, resolution, profile);
    onUpdateScene(scene.id, { [field]: imageUrl });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col border-b border-slate-200">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                Projects
              </Link>
              <input
                value={projectName}
                onChange={(event) => onProjectNameChange(event.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-sky-500"
                placeholder="Project name"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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

              <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <select
                  value={settings.resolution}
                  onChange={(event) => onUpdateSettings({ resolution: event.target.value as ExportResolution })}
                  className="bg-transparent outline-none"
                >
                  {resolutionOptions.map((option) => (
                    <option key={option} value={option}>
                      {exportResolutionLabels[option]}
                    </option>
                  ))}
                </select>
              </label>

              {projectId ? (
                <button
                  type="button"
                  onClick={onCopyProjectLink}
                  disabled={isCloudBusy}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Share
                </button>
              ) : null}

              <button
                type="button"
                onClick={onSaveProject}
                disabled={isCloudBusy}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isCloudBusy ? "Saving..." : "Save"}
              </button>

              {downloadUrl ? (
                <a href={downloadUrl} download="output.mp4" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                  Download
                </a>
              ) : null}

              <button
                type="button"
                onClick={onExport}
                disabled={isExporting}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {isExporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{cloudStatus ?? (projectId ? "Saved project is ready to edit." : "Unsaved draft.")}</span>
            <span>
              {resolutionMeta.width} x {resolutionMeta.height} ({exportResolutionLabels[resolution]})
              {isExporting ? ` • ${Math.round(exportProgress * 100)}%` : ""}
            </span>
          </div>
        </div>
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
