import { create } from "zustand";

import {
  createInitialSceneTrack,
  createScene,
  exportProfileLabels,
  exportResolutionDimensions,
  exportResolutionLabels,
  presetDefaults,
  type ExportSettings,
  type Scene,
  type SceneTrack,
  type SceneType,
} from "@/lib/sceneDefinitions";

export type { ExportProfile, ExportResolution, ExportSettings, Scene, SceneTrack, SceneType, TemplatePreset, TransitionType } from "@/lib/sceneDefinitions";
export { exportProfileLabels, exportResolutionDimensions, exportResolutionLabels, presetLabels, sceneDefinitions, sceneTypeLabels } from "@/lib/sceneDefinitions";

type SceneUpdates = Partial<Omit<Scene, "id" | "type">>;

type StudioStore = {
  sceneTrack: SceneTrack;
  selectedSceneId: string;
  exportSettings: ExportSettings;
  addScene: (type: SceneType) => void;
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
  sceneTrack: initialSceneTrack,
  selectedSceneId: initialSceneTrack.scenes[0].id,
  exportSettings: {
    fps: DEFAULT_FPS,
    transitionSeconds: DEFAULT_TRANSITION_SECONDS,
    backgroundColor: presetDefaults.clean.backgroundColor,
    textColor: presetDefaults.clean.textColor,
    preset: "clean",
    resolution: "720p",
    profile: "standard",
  },
  addScene: (type) => {
    const { sceneTrack } = get();
    if (sceneTrack.scenes.length >= 10) return;
    const nextScene = createScene(type, sceneTrack.scenes.length);
    set({
      sceneTrack: { ...sceneTrack, scenes: [...sceneTrack.scenes, nextScene] },
      selectedSceneId: nextScene.id,
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
      const nextPreset = updates.preset ?? state.exportSettings.preset;
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
