"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";

import { sceneTypeLabels, type Scene, type SceneTrack } from "@/store/useStore";

type SceneTimelineProps = {
  track: SceneTrack;
  selectedSceneId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddScene: () => void;
  onReorder: (fromId: string, toId: string) => void;
};

type SceneCardProps = {
  scene: Scene;
  index: number;
  active: boolean;
  dragging?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
};

function SceneCard({ scene, index, active, dragging = false, onSelect, onDelete, onDuplicate }: SceneCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(scene.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(scene.id);
        }
      }}
      className={`group relative flex h-[144px] w-[180px] flex-none cursor-grab flex-col rounded-[22px] border p-4 text-left transition-[background-color,border-color,opacity,box-shadow] duration-200 active:cursor-grabbing ${
        dragging
          ? "pointer-events-none border-dashed border-sky-400/30 bg-sky-400/6 opacity-35 shadow-none"
          : active
            ? "border-sky-400 bg-sky-400/10 shadow-[0_12px_24px_rgba(2,6,23,0.18)]"
            : "border-white/10 bg-white/[0.04] shadow-[0_12px_24px_rgba(2,6,23,0.18)] hover:border-white/20 hover:bg-white/[0.07]"
      }`}
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
  );
}

function SortableSceneCard(props: SceneCardProps) {
  const { scene } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <SceneCard {...props} dragging={isDragging} />
    </div>
  );
}

export function SceneTimeline({ track, selectedSceneId, onSelect, onDelete, onDuplicate, onAddScene, onReorder }: SceneTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const scenes = track.scenes;
  const sceneIds = useMemo(() => scenes.map((scene) => scene.id), [scenes]);
  const activeScene = activeId ? scenes.find((scene) => scene.id === activeId) ?? null : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <section className="shrink-0 px-4 py-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <SortableContext items={sceneIds} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {scenes.map((scene, index) => (
              <SortableSceneCard
                key={scene.id}
                scene={scene}
                index={index}
                active={scene.id === selectedSceneId}
                onSelect={onSelect}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}

            <button
              type="button"
              onClick={onAddScene}
              className="flex h-[144px] w-[180px] flex-none items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] text-3xl text-slate-500 transition-colors duration-150 hover:border-sky-400/40 hover:bg-white/[0.07] hover:text-sky-300"
            >
              +
            </button>
          </div>
        </SortableContext>

        <DragOverlay
          modifiers={[snapCenterToCursor]}
          dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          {activeScene ? (
            <div className="opacity-95">
              <SceneCard
                scene={activeScene}
                index={scenes.findIndex((scene) => scene.id === activeScene.id)}
                active
                onSelect={() => undefined}
                onDelete={() => undefined}
                onDuplicate={() => undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
