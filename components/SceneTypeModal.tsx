"use client";

import { sceneDefinitions, type SceneType } from "@/store/useStore";

type SceneTypeModalProps = {
  isOpen: boolean;
  isAnnouncementWorkspace: boolean;
  onClose: () => void;
  onSelect: (type: SceneType) => void;
};

export function SceneTypeModal({ isOpen, isAnnouncementWorkspace, onClose, onSelect }: SceneTypeModalProps) {
  if (!isOpen) return null;

  const availableSceneDefinitions = sceneDefinitions.filter((definition) => {
    if (definition.type === "slogan") return false;
    if (isAnnouncementWorkspace) return definition.type === "announcement-hero" || definition.type === "split-slogan";
    return definition.type !== "announcement-hero" && definition.type !== "split-slogan";
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.7)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Add scene</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Choose scene type</h2>
            <p className="mt-2 text-sm text-slate-400">Add a new block to the single scene track. New scene types can plug into this catalog later.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.08]">Close</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableSceneDefinitions.map((definition) => (
            <button
              key={definition.type}
              type="button"
              onClick={() => onSelect(definition.type)}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-sky-400/35 hover:bg-white/[0.07]"
            >
              <h3 className="text-lg font-semibold text-white">{definition.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{definition.catalogDescription}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
