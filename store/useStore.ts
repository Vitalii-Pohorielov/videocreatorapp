import { create } from "zustand";

import {
  createInitialSceneTrack,
  createInitialSceneTrackForVideoType,
  createScene,
  exportProfileLabels,
  exportResolutionDimensions,
  exportResolutionLabels,
  getDefaultProjectName,
  normalizeTemplatePreset,
  presetDefaults,
  type ExportSettings,
  type Scene,
  type SceneTrack,
  type SceneType,
  type VideoType,
} from "@/lib/sceneDefinitions";
import { getFeatureAnimatedIcons } from "@/lib/animatedFeatureIcons";
import { getDefaultTransition, isAnnouncementSceneType, normalizeAnnouncementTransition } from "@/lib/sceneTransitions";

export type { ExportProfile, ExportResolution, ExportSettings, Scene, SceneTrack, SceneType, TemplatePreset, TransitionType, VideoType } from "@/lib/sceneDefinitions";
export { exportProfileLabels, exportResolutionDimensions, exportResolutionLabels, freePromoSceneTypes, freeStylePresets, presetLabels, sceneDefinitions, sceneTypeLabels, videoTypeLabels } from "@/lib/sceneDefinitions";

type SceneUpdates = Partial<Omit<Scene, "id" | "type">>;

function normalizeSingleLineText(value: string) {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeSentenceCase(value: string) {
  const normalized = normalizeSingleLineText(value);
  if (!normalized) return "";
  return normalized.replace(/(^|[.!?]\s+)([a-zа-яё])/giu, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`).replace(/^([a-zа-яё])/iu, (letter) => letter.toUpperCase());
}

function normalizeTextRows(values: string[] | undefined, fallback: string[], count: number) {
  const source = Array.isArray(values) ? values : [];
  return Array.from({ length: count }, (_, index) => normalizeSingleLineText(source[index] ?? fallback[index] ?? ""));
}

function normalizeProjectImageUrls(values: string[] | undefined, count: number) {
  const source = Array.isArray(values) ? values : [];
  return Array.from({ length: count }, (_, index) => sanitizeImageUrl(source[index]));
}

function normalizeLoadedScene(scene: Scene): Scene {
  const normalizedTransition = isAnnouncementSceneType(scene.type)
    ? normalizeAnnouncementTransition(scene.transition)
    : scene.transition ?? getDefaultTransition(0);

  if ((scene as unknown as { type?: string }).type === "brand-reveal" || (scene as unknown as { type?: string }).type === "brand-reveal-alt") {
    return {
      ...scene,
      transition: normalizedTransition,
      title: normalizeSentenceCase(scene.title),
    };
  }

  if ((scene as unknown as { type?: string }).type === "checklist") {
    return {
      ...scene,
      transition: normalizedTransition,
      type: "process",
      name: scene.name.replace(/checklist/i, "Process"),
      bullets: normalizeFixedBullets(scene.bullets, 3),
    };
  }

  if ((scene as unknown as { type?: string }).type === "faq") {
    return {
      ...scene,
      transition: normalizedTransition,
      type: "center-text",
      name: scene.name.replace(/faq/i, "Center Text"),
      eyebrow: scene.eyebrow || "Focus",
      title: scene.title || "Common questions",
      subtitle: scene.subtitle || "Short answers that clear up hesitation.",
      description: scene.description || scene.bullets.join(" "),
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
    } as Scene;
  }

  if ((scene as unknown as { type?: string }).type === "testimonial-wall") {
    return {
      ...scene,
      transition: normalizedTransition,
      type: "center-text",
      name: scene.name.replace(/testimonial-wall/i, "Center Text"),
      eyebrow: scene.eyebrow || "Social proof",
      title: scene.title || "Loved by teams",
      subtitle: scene.subtitle || scene.bullets[0] || "Quick quotes from people using it.",
      description: scene.bullets.slice(1).join(" "),
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
    } as Scene;
  }

  if ((scene as unknown as { type?: string }).type === "center-text") {
    return {
      ...scene,
      transition: normalizedTransition,
      title: normalizeSentenceCase(scene.title),
    };
  }

  if ((scene as unknown as { type?: string }).type === "pricing") {
    const planTitles = normalizeTextRows((scene as Scene).pricingPlanTitles, ["Starter", "Pro", "Team"], 3);
    const planDescriptions = normalizeTextRows(
      (scene as Scene).pricingPlanDescriptions,
      [
        "Great for small launches and demos.",
        "Best balance of speed and polish.",
        "Everything a growing team needs.",
      ],
      3,
    );
    return {
      ...scene,
      transition: normalizedTransition,
      pricingPlanTitles: planTitles,
      pricingPlanDescriptions: planDescriptions,
    } as Scene;
  }

  if ((scene as unknown as { type?: string }).type === "process") {
    return {
      ...scene,
      transition: normalizedTransition,
      processStepDescriptions: normalizeTextRows(
        (scene as Scene).processStepDescriptions,
        ["Set the direction.", "Build the core scene.", "Export and share."],
        3,
      ),
    } as Scene;
  }

  if ((scene as unknown as { type?: string }).type === "announcement-hero") {
    const nextProjectCount = Math.min(25, Math.max(1, Number((scene as Scene).projectCount ?? 8)));
    return {
      ...scene,
      transition: normalizedTransition,
      projectCount: nextProjectCount,
      projectImageUrls: normalizeProjectImageUrls((scene as Scene).projectImageUrls, nextProjectCount),
    } as Scene;
  }

  if ((scene as unknown as { type?: string }).type !== "metrics") return { ...scene, transition: normalizedTransition };

  return {
    ...scene,
    transition: normalizedTransition,
    type: "feature-grid",
    eyebrow: scene.eyebrow || "Highlights",
    title: scene.title || "Why teams choose it",
    name: scene.name.replace(/metrics/i, "Features"),
  } as Scene;
}

function normalizeFixedBullets(bullets: string[], count: number) {
  return Array.from({ length: count }, (_, index) => bullets[index] ?? "");
}

type StudioStore = {
  projectId: string | null;
  projectName: string;
  sceneTrack: SceneTrack;
  selectedSceneId: string;
  exportSettings: ExportSettings;
  resetProject: (videoType?: VideoType) => void;
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
  restoreWorkspaceState: (state: {
    projectName: string;
    sceneTrack: SceneTrack;
    exportSettings: ExportSettings;
    selectedSceneId: string;
  }) => void;
};

const clampDuration = (value: number) => Math.min(8, Math.max(1.5, value));
const DEFAULT_FPS = 30;
const DEFAULT_TRANSITION_SECONDS = 0.8;
const MAX_BULLETS = 6;
const MAX_SCENES = 15;
const sanitizeImageUrl = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "." || trimmed === "/") return "";
  if (/^https?:\/\/[^/]+\/\.?$/.test(trimmed)) return "";
  return trimmed;
};

function normalizeSceneArrays(scene: Scene, updates: SceneUpdates) {
  const sourceBullets = updates.bullets === undefined ? scene.bullets : updates.bullets;
  const nextBullets = sourceBullets.filter(Boolean).slice(0, MAX_BULLETS);
  const sourceEmojis = updates.bulletEmojis === undefined ? scene.bulletEmojis : updates.bulletEmojis;
  const sourceImages = updates.bulletImageUrls === undefined ? scene.bulletImageUrls : updates.bulletImageUrls;
  const defaultFeatureIcons = scene.type === "feature-grid" ? getFeatureAnimatedIcons(nextBullets.length) : [];
  const nextBulletEmojis = Array.from({ length: nextBullets.length }, (_, index) => sourceEmojis[index] ?? "");
  const nextBulletImageUrls = Array.from({ length: nextBullets.length }, (_, index) => {
    const normalizedImageUrl = sanitizeImageUrl(sourceImages[index]);
    if (normalizedImageUrl || nextBulletEmojis[index]?.trim() || scene.type !== "feature-grid") return normalizedImageUrl;
    return defaultFeatureIcons[index]?.imageUrl ?? "";
  });

  return { nextBullets, nextBulletEmojis, nextBulletImageUrls };
}

function normalizeAnnouncementProjectImages(scene: Scene, updates: SceneUpdates) {
  const sourceProjectCount = updates.projectCount === undefined ? scene.projectCount : updates.projectCount;
  const nextProjectCount = Math.min(25, Math.max(1, Number(sourceProjectCount ?? 8)));
  const sourceProjectImages = updates.projectImageUrls === undefined ? scene.projectImageUrls : updates.projectImageUrls;
  const nextProjectImageUrls = normalizeProjectImageUrls(sourceProjectImages, nextProjectCount);

  return { nextProjectCount, nextProjectImageUrls };
}

const initialSceneTrack = createInitialSceneTrack();
const defaultInitialProjectName = getDefaultProjectName("promo");

export const useStore = create<StudioStore>((set, get) => ({
  projectId: null,
  projectName: defaultInitialProjectName,
  sceneTrack: initialSceneTrack,
  selectedSceneId: initialSceneTrack.scenes[0]?.id ?? "",
  exportSettings: {
    fps: DEFAULT_FPS,
    transitionSeconds: DEFAULT_TRANSITION_SECONDS,
    backgroundColor: presetDefaults.white.backgroundColor,
    textColor: presetDefaults.white.textColor,
    preset: "white",
    resolution: "720p",
    profile: "standard",
  },
  resetProject: (videoType = "promo") => {
    const nextTrack = createInitialSceneTrackForVideoType(videoType);
    set({
      projectId: null,
      projectName: getDefaultProjectName(videoType),
      sceneTrack: nextTrack,
      selectedSceneId: nextTrack.scenes[0]?.id ?? "",
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
    const nextScenes = project.sceneTrack.scenes.map((scene) => normalizeLoadedScene(scene));
    const normalizedPreset = normalizeTemplatePreset(project.exportSettings.preset);
    const normalizedDefaults = presetDefaults[normalizedPreset];
    set({
      projectId: project.id,
      projectName: project.name.trim() || getDefaultProjectName("promo"),
      sceneTrack: {
        ...project.sceneTrack,
        id: "main-track",
        name: project.sceneTrack.name || "Scene Track",
        scenes: nextScenes,
      },
      selectedSceneId: nextScenes[0]?.id ?? "",
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
    if (sceneTrack.scenes.length >= MAX_SCENES) return;
    const nextScene = createScene(type, sceneTrack.scenes.length);
    set({
      sceneTrack: { ...sceneTrack, scenes: [...sceneTrack.scenes, nextScene] },
      selectedSceneId: nextScene.id,
    });
  },
  duplicateScene: (id) => {
    const { sceneTrack } = get();
    if (sceneTrack.scenes.length >= MAX_SCENES) return;

    const sceneIndex = sceneTrack.scenes.findIndex((scene) => scene.id === id);
    if (sceneIndex < 0) return;

    const sourceScene = sceneTrack.scenes[sceneIndex];
    const duplicatedScene: Scene = {
      ...sourceScene,
      id: crypto.randomUUID(),
      name: `${sourceScene.name} Copy`,
      bullets: [...sourceScene.bullets],
      projectImageUrls: [...(sourceScene.projectImageUrls ?? [])],
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
                const { nextProjectCount, nextProjectImageUrls } = normalizeAnnouncementProjectImages(scene, updates);
                return {
                  ...scene,
                  ...updates,
                  transition:
                    scene.type === "announcement-hero" || scene.type === "split-slogan"
                      ? normalizeAnnouncementTransition(updates.transition ?? scene.transition)
                      : updates.transition ?? scene.transition,
                  durationSeconds: updates.durationSeconds === undefined ? scene.durationSeconds : clampDuration(updates.durationSeconds),
                  bullets: nextBullets,
                  projectCount: scene.type === "announcement-hero" ? nextProjectCount : scene.projectCount,
                  projectImageUrls: scene.type === "announcement-hero" ? nextProjectImageUrls : scene.projectImageUrls,
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
      selectedSceneId: nextSelectedId ?? "",
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
  restoreWorkspaceState: (nextState) => {
    set((state) => ({
      projectId: state.projectId,
      projectName: nextState.projectName,
      sceneTrack: nextState.sceneTrack,
      selectedSceneId: nextState.selectedSceneId,
      exportSettings: nextState.exportSettings,
    }));
  },
}));
