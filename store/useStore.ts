import { create } from "zustand";

import {
  createInitialSceneTrack,
  createScene,
  exportProfileLabels,
  exportResolutionDimensions,
  exportResolutionLabels,
  normalizeTemplatePreset,
  presetDefaults,
  type ExportSettings,
  type Scene,
  type SceneTrack,
  type SceneType,
} from "@/lib/sceneDefinitions";

export type { ExportProfile, ExportResolution, ExportSettings, Scene, SceneTrack, SceneType, TemplatePreset, TransitionType } from "@/lib/sceneDefinitions";
export { exportProfileLabels, exportResolutionDimensions, exportResolutionLabels, presetLabels, sceneDefinitions, sceneTypeLabels } from "@/lib/sceneDefinitions";

type SceneUpdates = Partial<Omit<Scene, "id" | "type">>;

function normalizeLoadedScene(scene: Scene): Scene {
  if ((scene as unknown as { type?: string }).type !== "metrics") return scene;

  return {
    ...scene,
    type: "feature-grid",
    eyebrow: scene.eyebrow || "Highlights",
    title: scene.title || "Why teams choose it",
    name: scene.name.replace(/metrics/i, "Features"),
  } as Scene;
}

type StudioStore = {
  projectId: string | null;
  projectName: string;
  sceneTrack: SceneTrack;
  selectedSceneId: string;
  exportSettings: ExportSettings;
  resetProject: () => void;
  hydrateProject: (project: {
    id: string | null;
    name: string;
    sceneTrack: SceneTrack;
    exportSettings: ExportSettings;
  }) => void;
  updateProjectMeta: (updates: { id?: string | null; name?: string }) => void;
  addScene: (type: SceneType) => void;
  duplicateScene: (id: string) => void;
  updateScene: (id: string, updates: SceneUpdates) => void;
  deleteScene: (id: string) => void;
  selectScene: (id: string) => void;
  reorderScenes: (fromId: string, toId: string) => void;
  updateExportSettings: (updates: Partial<ExportSettings>) => void;
};

const clampDuration = (value: number) => Math.min(8, Math.max(1.5, value));
const DEFAULT_FPS = 30;
const DEFAULT_TRANSITION_SECONDS = 0.8;
const MAX_BULLETS = 6;
const sanitizeImageUrl = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "." || trimmed === "/") return "";
  if (/^https?:\/\/[^/]+\/\.?$/.test(trimmed)) return "";
  return trimmed;
};

function normalizeSceneArrays(scene: Scene, updates: SceneUpdates) {
  const nextBullets = (updates.bullets === undefined ? scene.bullets : updates.bullets).filter(Boolean).slice(0, MAX_BULLETS);
  const sourceEmojis = updates.bulletEmojis === undefined ? scene.bulletEmojis : updates.bulletEmojis;
  const sourceImages = updates.bulletImageUrls === undefined ? scene.bulletImageUrls : updates.bulletImageUrls;
  const nextBulletEmojis = Array.from({ length: nextBullets.length }, (_, index) => sourceEmojis[index] ?? "");
  const nextBulletImageUrls = Array.from({ length: nextBullets.length }, (_, index) => sanitizeImageUrl(sourceImages[index]));

  return { nextBullets, nextBulletEmojis, nextBulletImageUrls };
}

const initialSceneTrack = createInitialSceneTrack();

export const useStore = create<StudioStore>((set, get) => ({
  projectId: null,
  projectName: "Untitled project",
  sceneTrack: initialSceneTrack,
  selectedSceneId: initialSceneTrack.scenes[0].id,
  exportSettings: {
    fps: DEFAULT_FPS,
    transitionSeconds: DEFAULT_TRANSITION_SECONDS,
    backgroundColor: presetDefaults.white.backgroundColor,
    textColor: presetDefaults.white.textColor,
    preset: "white",
    resolution: "720p",
    profile: "standard",
  },
  resetProject: () => {
    const nextTrack = createInitialSceneTrack();
    set({
      projectId: null,
      projectName: "Untitled project",
      sceneTrack: nextTrack,
      selectedSceneId: nextTrack.scenes[0].id,
      exportSettings: {
        fps: DEFAULT_FPS,
        transitionSeconds: DEFAULT_TRANSITION_SECONDS,
        backgroundColor: presetDefaults.white.backgroundColor,
        textColor: presetDefaults.white.textColor,
        preset: "white",
        resolution: "720p",
        profile: "standard",
      },
    });
  },
  hydrateProject: (project) => {
    const nextScenes =
      project.sceneTrack.scenes.length > 0
        ? project.sceneTrack.scenes.map((scene) => normalizeLoadedScene(scene))
        : createInitialSceneTrack().scenes;
    const normalizedPreset = normalizeTemplatePreset(project.exportSettings.preset);
    const normalizedDefaults = presetDefaults[normalizedPreset];
    set({
      projectId: project.id,
      projectName: project.name.trim() || "Untitled project",
      sceneTrack: {
        ...project.sceneTrack,
        id: "main-track",
        name: project.sceneTrack.name || "Scene Track",
        scenes: nextScenes,
      },
      selectedSceneId: nextScenes[0]?.id ?? crypto.randomUUID(),
      exportSettings: {
        fps: DEFAULT_FPS,
        transitionSeconds: DEFAULT_TRANSITION_SECONDS,
        backgroundColor: project.exportSettings.backgroundColor || normalizedDefaults.backgroundColor,
        textColor: project.exportSettings.textColor || normalizedDefaults.textColor,
        preset: normalizedPreset,
        resolution: project.exportSettings.resolution,
        profile: project.exportSettings.profile,
      },
    });
  },
  updateProjectMeta: (updates) =>
    set((state) => ({
      projectId: updates.id === undefined ? state.projectId : updates.id,
      projectName: updates.name === undefined ? state.projectName : updates.name,
    })),
  addScene: (type) => {
    const { sceneTrack } = get();
    if (sceneTrack.scenes.length >= 10) return;
    const nextScene = createScene(type, sceneTrack.scenes.length);
    set({
      sceneTrack: { ...sceneTrack, scenes: [...sceneTrack.scenes, nextScene] },
      selectedSceneId: nextScene.id,
    });
  },
  duplicateScene: (id) => {
    const { sceneTrack } = get();
    if (sceneTrack.scenes.length >= 10) return;

    const sceneIndex = sceneTrack.scenes.findIndex((scene) => scene.id === id);
    if (sceneIndex < 0) return;

    const sourceScene = sceneTrack.scenes[sceneIndex];
    const duplicatedScene: Scene = {
      ...sourceScene,
      id: crypto.randomUUID(),
      name: `${sourceScene.name} Copy`,
      bullets: [...sourceScene.bullets],
      bulletEmojis: [...sourceScene.bulletEmojis],
      bulletImageUrls: [...sourceScene.bulletImageUrls],
    };

    const nextScenes = [...sceneTrack.scenes];
    nextScenes.splice(sceneIndex + 1, 0, duplicatedScene);

    set({
      sceneTrack: { ...sceneTrack, scenes: nextScenes },
      selectedSceneId: duplicatedScene.id,
    });
  },
  updateScene: (id, updates) => {
    set((state) => ({
      sceneTrack: {
        ...state.sceneTrack,
        scenes: state.sceneTrack.scenes.map((scene) =>
          scene.id === id
            ? (() => {
                const { nextBullets, nextBulletEmojis, nextBulletImageUrls } = normalizeSceneArrays(scene, updates);
                return {
                  ...scene,
                  ...updates,
                  transition: "fade",
                  durationSeconds: updates.durationSeconds === undefined ? scene.durationSeconds : clampDuration(updates.durationSeconds),
                  bullets: nextBullets,
                  bulletEmojis: nextBulletEmojis,
                  bulletImageUrls: nextBulletImageUrls,
                  logoImageUrl: updates.logoImageUrl === undefined ? scene.logoImageUrl : sanitizeImageUrl(updates.logoImageUrl),
                  websiteImageUrl: updates.websiteImageUrl === undefined ? scene.websiteImageUrl : sanitizeImageUrl(updates.websiteImageUrl),
                  authorImageUrl: updates.authorImageUrl === undefined ? scene.authorImageUrl : sanitizeImageUrl(updates.authorImageUrl),
                };
              })()
            : scene,
        ),
      },
    }));
  },
  deleteScene: (id) => {
    const { sceneTrack, selectedSceneId } = get();
    if (sceneTrack.scenes.length === 1) return;

    const sceneIndex = sceneTrack.scenes.findIndex((scene) => scene.id === id);
    const nextScenes = sceneTrack.scenes.filter((scene) => scene.id !== id);
    const nextSelectedId =
      selectedSceneId === id ? nextScenes[Math.max(0, sceneIndex - 1)]?.id ?? nextScenes[0].id : selectedSceneId;

    set({
      sceneTrack: { ...sceneTrack, scenes: nextScenes },
      selectedSceneId: nextSelectedId,
    });
  },
  selectScene: (id) => set({ selectedSceneId: id }),
  reorderScenes: (fromId, toId) => {
    if (fromId === toId) return;
    set((state) => {
      const nextScenes = [...state.sceneTrack.scenes];
      const fromIndex = nextScenes.findIndex((scene) => scene.id === fromId);
      const toIndex = nextScenes.findIndex((scene) => scene.id === toId);
      if (fromIndex < 0 || toIndex < 0) return state;
      const [moved] = nextScenes.splice(fromIndex, 1);
      nextScenes.splice(toIndex, 0, moved);

      return {
        sceneTrack: {
          ...state.sceneTrack,
          scenes: nextScenes,
        },
      };
    });
  },
  updateExportSettings: (updates) => {
    set((state) => {
      const nextPreset = updates.preset ? normalizeTemplatePreset(updates.preset) : state.exportSettings.preset;
      const presetColors = presetDefaults[nextPreset];
      const presetChanged = updates.preset !== undefined && updates.preset !== state.exportSettings.preset;

      return {
        exportSettings: {
          fps: DEFAULT_FPS,
          transitionSeconds: DEFAULT_TRANSITION_SECONDS,
          backgroundColor:
            updates.backgroundColor === undefined
              ? presetChanged
                ? presetColors.backgroundColor
                : state.exportSettings.backgroundColor
              : updates.backgroundColor,
          textColor:
            updates.textColor === undefined
              ? presetChanged
                ? presetColors.textColor
                : state.exportSettings.textColor
              : updates.textColor,
          preset: nextPreset,
          resolution: updates.resolution ?? state.exportSettings.resolution,
          profile: updates.profile ?? state.exportSettings.profile,
        },
      };
    });
  },
}));
