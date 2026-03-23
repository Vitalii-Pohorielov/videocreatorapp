"use client";

import { exportResolutionLabels, type ExportResolution, type ExportSettings } from "@/store/useStore";

type TopBarProps = {
  settings: ExportSettings;
  isExporting: boolean;
  exportProgress: number;
  downloadUrl: string | null;
  onUpdateSettings: (updates: Partial<ExportSettings>) => void;
  onExport: () => void;
};

export function TopBar({ settings, isExporting, exportProgress, downloadUrl, onUpdateSettings, onExport }: TopBarProps) {
  const resolutionOptions: ExportResolution[] = ["480p", "540p", "720p"];

  return (
    <header className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Video editor</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">SaaS Video Builder</h1>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="min-w-[132px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Export size</span>
            <select
              value={settings.resolution}
              onChange={(event) => onUpdateSettings({ resolution: event.target.value as ExportResolution })}
              className="w-full bg-transparent font-medium outline-none"
            >
              {resolutionOptions.map((resolution) => (
                <option key={resolution} value={resolution}>
                  {exportResolutionLabels[resolution]}
                </option>
              ))}
            </select>
          </label>

          <div className="min-w-[210px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>{isExporting ? "Rendering" : "Ready"}</span>
              <span>{Math.round(exportProgress * 100)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.max(exportProgress * 100, isExporting ? 8 : 0)}%` }} />
            </div>
          </div>

          <div className="flex gap-3">
            {downloadUrl ? (
              <a href={downloadUrl} download="output.mp4" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                Download MP4
              </a>
            ) : null}
            <button type="button" onClick={onExport} disabled={isExporting} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
              {isExporting ? "Exporting..." : "Export video"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
