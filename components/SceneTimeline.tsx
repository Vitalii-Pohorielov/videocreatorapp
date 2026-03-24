"use client";

import { useEffect, useRef, useState } from "react";

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
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [freshSceneIds, setFreshSceneIds] = useState<string[]>([]);
  const { scenes } = track;
  const previousSceneIdsRef = useRef<string[]>(scenes.map((scene) => scene.id));
  const draggedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const previousIds = previousSceneIdsRef.current;
    const nextIds = scenes.map((scene) => scene.id);
    const addedIds = nextIds.filter((id) => !previousIds.includes(id));

    if (addedIds.length > 0) {
      setFreshSceneIds((current) => Array.from(new Set([...current, ...addedIds])));
      const timeout = window.setTimeout(() => {
        setFreshSceneIds((current) => current.filter((id) => !addedIds.includes(id)));
      }, 520);

      previousSceneIdsRef.current = nextIds;
      return () => window.clearTimeout(timeout);
    }

    previousSceneIdsRef.current = nextIds;
  }, [scenes]);

  return (
    <section className="shrink-0 px-4 py-3">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {scenes.map((scene, index) => {
          const active = scene.id === selectedSceneId;
          const isDragged = draggedId === scene.id;
          const isFresh = freshSceneIds.includes(scene.id);
          const showInsertSlot = Boolean(draggedId && dragOverId === scene.id && draggedId !== scene.id);
          return (
            <div key={scene.id} className="flex items-stretch gap-3">
              <div
                aria-hidden={!showInsertSlot}
                className={`flex h-[144px] flex-none items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-sky-400/35 bg-sky-400/8 text-sky-200 transition-all duration-300 ease-out ${showInsertSlot ? "w-[72px] opacity-100" : "w-0 border-transparent opacity-0"}`}
              >
                <div className="flex h-[104px] w-[54px] items-center justify-center rounded-[18px] border border-sky-300/35 bg-white/5 text-[10px] font-semibold uppercase tracking-[0.22em]">
                  Drop
                </div>
              </div>
              <div
                draggable
                onDragStart={(event) => {
                  draggedIdRef.current = scene.id;
                  setDraggedId(scene.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", scene.id);
                }}
                onDragEnter={() => {
                  const currentDraggedId = draggedIdRef.current;
                  if (currentDraggedId && currentDraggedId !== scene.id) setDragOverId(scene.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  const currentDraggedId = draggedIdRef.current || event.dataTransfer.getData("text/plain");
                  if (currentDraggedId && currentDraggedId !== scene.id && dragOverId !== scene.id) {
                    setDragOverId(scene.id);
                  }
                }}
                onDrop={(event) => {
                  const currentDraggedId = draggedIdRef.current || event.dataTransfer.getData("text/plain");
                  if (currentDraggedId) onReorder(currentDraggedId, scene.id);
                  draggedIdRef.current = null;
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                onDragEnd={() => {
                  draggedIdRef.current = null;
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(scene.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(scene.id);
                  }
                }}
                className={`group relative flex h-[144px] w-[180px] flex-none cursor-grab flex-col rounded-[22px] border p-4 text-left transition-all duration-300 ease-out active:cursor-grabbing ${active ? "border-sky-400 bg-sky-400/10" : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"} ${isDragged ? "scale-[0.98] opacity-55 shadow-none" : "shadow-[0_12px_24px_rgba(2,6,23,0.18)]"} ${isFresh ? "animate-scene-card-enter" : ""}`}
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
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/[0.12]"
                      aria-label="Duplicate scene"
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <rect x="5.25" y="2.75" width="7" height="9" rx="1.25" />
                        <path d="M3.75 5.25V11a1.25 1.25 0 0 0 1.25 1.25h4.25" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(scene.id);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-400 transition hover:bg-rose-500/18 hover:text-rose-300"
                      aria-label="Delete scene"
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3.75 5.25h8.5" />
                        <path d="M6.25 2.75h3.5" />
                        <path d="M5.25 5.25v6.25" />
                        <path d="M8 5.25v6.25" />
                        <path d="M10.75 5.25v6.25" />
                        <path d="M4.5 5.25l.35 7.05A1.25 1.25 0 0 0 6.1 13.5h3.8a1.25 1.25 0 0 0 1.25-1.2l.35-7.05" />
                      </svg>
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
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddScene}
          className="flex h-[144px] w-[180px] flex-none items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] text-3xl text-slate-500 transition-all duration-300 hover:scale-[1.02] hover:border-sky-400/40 hover:bg-white/[0.07] hover:text-sky-300"
        >
          +
        </button>
      </div>
    </section>
  );
}
