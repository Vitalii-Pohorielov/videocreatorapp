"use client";

import { sceneDefinitions, type SceneType } from "@/store/useStore";

type SceneTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: SceneType) => void;
};

export function SceneTypeModal({ isOpen, onClose, onSelect }: SceneTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Add scene</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Choose scene type</h2>
            <p className="mt-2 text-sm text-slate-500">Add a new block to the single scene track. New scene types can plug into this catalog later.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Close</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sceneDefinitions.map((definition) => (
            <button key={definition.type} type="button" onClick={() => onSelect(definition.type)} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white">
              <h3 className="text-lg font-semibold text-slate-900">{definition.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{definition.catalogDescription}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
