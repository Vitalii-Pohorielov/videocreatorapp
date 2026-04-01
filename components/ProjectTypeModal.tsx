"use client";

import { videoTypeLabels, type VideoType } from "@/store/useStore";

type ProjectTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (videoType: VideoType) => void;
};

const projectTypeDescriptions: Record<VideoType, string> = {
  promo: "Starts with the current working promo structure so you can edit and export immediately.",
  announcement: "Starts as an empty editor for announcement-style videos, ready for scenes you add manually.",
};

export function ProjectTypeModal({ isOpen, onClose, onSelect }: ProjectTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-slate-950/95 p-6 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">New project</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">Choose video type</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Promo keeps the current ready-made flow. Announcement opens a blank canvas so you can build the sequence yourself.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(["promo", "announcement"] as const).map((videoType) => (
            <button
              key={videoType}
              type="button"
              onClick={() => onSelect(videoType)}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-sky-400/35 hover:bg-white/[0.07]"
            >
              <h3 className="text-lg font-semibold text-white">{videoTypeLabels[videoType]}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{projectTypeDescriptions[videoType]}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
