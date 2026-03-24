"use client";

import { useState } from "react";

import { sceneTypeLabels, type SceneTrack } from "@/store/useStore";

type SceneTimelineProps = {
  track: SceneTrack;
  selectedSceneId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddScene: () => void;
  onReorder: (fromId: string, toId: string) => void;
};

export function SceneTimeline({ track, selectedSceneId, onSelect, onDelete, onDuplicate, onAddScene, onReorder }: SceneTimelineProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { scenes } = track;

  return (
    <section className="shrink-0 px-4 py-3">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {scenes.map((scene, index) => {
          const active = scene.id === selectedSceneId;
          return (
            <div
              key={scene.id}
              draggable
              onDragStart={() => setDraggedId(scene.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedId) onReorder(draggedId, scene.id);
                setDraggedId(null);
              }}
              onDragEnd={() => setDraggedId(null)}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(scene.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(scene.id);
                }
              }}
              className={`group relative flex h-[144px] w-[180px] flex-none flex-col rounded-[22px] border p-4 text-left transition ${active ? "border-sky-400 bg-sky-400/10" : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{scene.name || `Scene ${index + 1}`}</p>
                  <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-slate-400">{sceneTypeLabels[scene.type]}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDuplicate(scene.id);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-slate-200 transition hover:bg-white/15"
                    aria-label="Duplicate scene"
                  >
                    DUP
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(scene.id);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-slate-200 transition hover:bg-rose-400/20 hover:text-rose-200"
                    aria-label="Delete scene"
                  >
                    X
                  </button>
                </div>
              </div>
              <div className="mt-auto flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-500">Scene {index + 1}</p>
                  <p className="mt-1 text-xs text-slate-300">{scene.durationSeconds.toFixed(1)}s</p>
                </div>
                <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Ready
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddScene}
          className="flex h-[144px] w-[180px] flex-none items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] text-3xl text-slate-500 transition hover:border-sky-400/40 hover:bg-white/[0.07] hover:text-sky-300"
        >
          +
        </button>
      </div>
    </section>
  );
}
