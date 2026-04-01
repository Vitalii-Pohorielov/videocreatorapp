import type { Scene, SceneType, TransitionType } from "@/lib/sceneDefinitions";

export const transitionTypeLabels: Record<TransitionType, string> = {
  fade: "Fade",
  "slide-left": "Slide left",
  "slide-right": "Slide right",
  "slide-up": "Slide up",
  "slide-down": "Slide down",
  "zoom-in": "Zoom in",
  "zoom-out": "Zoom out",
};

const announcementSceneTypes: SceneType[] = ["announcement-hero", "split-slogan"];

const transitionCycle: TransitionType[] = ["slide-left", "slide-up", "slide-right", "slide-down", "zoom-in", "zoom-out", "fade"];

export function isAnnouncementSceneType(type: SceneType) {
  return announcementSceneTypes.includes(type);
}

export function isAnnouncementScene(scene: Pick<Scene, "type">) {
  return isAnnouncementSceneType(scene.type);
}

export function getDefaultTransition(index: number, sceneType?: SceneType): TransitionType {
  if (sceneType && !isAnnouncementSceneType(sceneType)) return "fade";
  return transitionCycle[index % transitionCycle.length] ?? "fade";
}

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeInOut(value: number) {
  const clamped = clampProgress(value);
  return 0.5 - Math.cos(clamped * Math.PI) / 2;
}

export type TransitionFrameMotion = {
  currentX: number;
  currentY: number;
  currentScale: number;
  currentOpacity: number;
  nextX: number;
  nextY: number;
  nextScale: number;
  nextOpacity: number;
};

export function getTransitionFrameMotion(type: TransitionType, progress: number, width: number, height: number): TransitionFrameMotion {
  const eased = easeInOut(progress);

  switch (type) {
    case "slide-left":
      return {
        currentX: -width * 0.22 * eased,
        currentY: 0,
        currentScale: 1,
        currentOpacity: 1,
        nextX: width * (1 - eased),
        nextY: 0,
        nextScale: 1,
        nextOpacity: 1,
      };
    case "slide-right":
      return {
        currentX: width * 0.22 * eased,
        currentY: 0,
        currentScale: 1,
        currentOpacity: 1,
        nextX: -width * (1 - eased),
        nextY: 0,
        nextScale: 1,
        nextOpacity: 1,
      };
    case "slide-up":
      return {
        currentX: 0,
        currentY: -height * 0.18 * eased,
        currentScale: 1,
        currentOpacity: 1,
        nextX: 0,
        nextY: height * (1 - eased),
        nextScale: 1,
        nextOpacity: 1,
      };
    case "slide-down":
      return {
        currentX: 0,
        currentY: height * 0.18 * eased,
        currentScale: 1,
        currentOpacity: 1,
        nextX: 0,
        nextY: -height * (1 - eased),
        nextScale: 1,
        nextOpacity: 1,
      };
    case "zoom-in":
      return {
        currentX: 0,
        currentY: 0,
        currentScale: 1 + 0.08 * eased,
        currentOpacity: 1 - eased * 0.88,
        nextX: 0,
        nextY: 0,
        nextScale: 1.12 - 0.12 * eased,
        nextOpacity: eased,
      };
    case "zoom-out":
      return {
        currentX: 0,
        currentY: 0,
        currentScale: 1 - 0.08 * eased,
        currentOpacity: 1 - eased * 0.84,
        nextX: 0,
        nextY: 0,
        nextScale: 0.9 + 0.1 * eased,
        nextOpacity: eased,
      };
    case "fade":
    default:
      return {
        currentX: 0,
        currentY: 0,
        currentScale: 1,
        currentOpacity: 1 - eased,
        nextX: 0,
        nextY: 0,
        nextScale: 1,
        nextOpacity: eased,
      };
  }
}
