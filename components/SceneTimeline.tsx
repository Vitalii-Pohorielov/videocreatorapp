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
              className={`group h-[144px] w-[140px] flex-none rounded-[22px] border p-1.5 text-left transition ${active ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <div className="relative aspect-video overflow-hidden rounded-[14px] bg-slate-100">
                <SceneStage scene={scene} backgroundColor={backgroundColor} textColor={textColor} preset={preset} compact />
              </div>
              <div className="mt-1.5 flex h-[32px] items-start justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-900">Scene {index + 1}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{sceneTypeLabels[scene.type]}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end text-right">
                  <p className="text-[10px] text-slate-400">{scene.durationSeconds.toFixed(1)}s</p>
                  <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(scene.id); }} className="mt-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-slate-200">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddScene}
          className="flex h-[144px] w-[140px] flex-none items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50 text-3xl text-slate-400 transition hover:border-slate-400 hover:bg-white hover:text-slate-600"
        >
          +
        </button>
      </div>
    </section>
  );
}
