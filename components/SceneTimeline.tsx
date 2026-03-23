"use client";

import { useState } from "react";

import { SceneStage } from "@/components/SceneStage";
import { sceneTypeLabels, type SceneTrack, type TemplatePreset } from "@/store/useStore";

type SceneTimelineProps = {
  track: SceneTrack;
  selectedSceneId: string;
  backgroundColor: string;
  textColor: string;
  preset: TemplatePreset;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAddScene: () => void;
  onReorder: (fromId: string, toId: string) => void;
};

export function SceneTimeline({ track, selectedSceneId, backgroundColor, textColor, preset, onSelect, onDelete, onAddScene, onReorder }: SceneTimelineProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { scenes } = track;

  return (
    <section className="shrink-0 px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Single track</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{track.name}</h2>
        </div>
        <button type="button" onClick={onAddScene} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
          + Add scene
        </button>
      </div>

      <div className="mb-2 text-xs text-slate-400">One linear scene track. Drag blocks to reorder.</div>

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
              className={`group h-[178px] w-[170px] flex-none rounded-3xl border p-2 text-left transition ${active ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <div className="relative aspect-video overflow-hidden rounded-[18px] bg-slate-100">
                <SceneStage scene={scene} backgroundColor={backgroundColor} textColor={textColor} preset={preset} compact />
              </div>
              <div className="mt-2 flex h-[42px] items-start justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">Scene {index + 1}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{sceneTypeLabels[scene.type]}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end text-right">
                  <p className="text-[11px] text-slate-400">{scene.durationSeconds.toFixed(1)}s</p>
                  <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(scene.id); }} className="mt-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-slate-200">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
