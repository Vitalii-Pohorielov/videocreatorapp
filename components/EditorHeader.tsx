"use client";

import Link from "next/link";

import { exportProfileLabels, exportResolutionLabels, type ExportProfile, type ExportResolution, type ExportSettings } from "@/store/useStore";

type EditorHeaderProps = {
  projectId: string | null;
  projectName: string;
  settings: ExportSettings;
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
};

export function EditorHeader({
  projectId,
  projectName,
  settings,
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
}: EditorHeaderProps) {
  const resolutionOptions: ExportResolution[] = ["480p", "540p", "720p"];
  const profileOptions: ExportProfile[] = ["draft", "standard", "high"];

  return (
    <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
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
              {profileOptions.map((profile) => (
                <option key={profile} value={profile}>
                  {exportProfileLabels[profile]}
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
              {resolutionOptions.map((resolution) => (
                <option key={resolution} value={resolution}>
                  {exportResolutionLabels[resolution]}
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
        <span>{isExporting ? `Rendering ${Math.round(exportProgress * 100)}%` : "Editor ready"}</span>
      </div>
    </header>
  );
}
