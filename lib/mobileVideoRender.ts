import { exportResolutionDimensions, type ExportSettings, type Scene } from "@/lib/sceneDefinitions";
import { getTransitionFrameMotion, isAnnouncementScene } from "@/lib/sceneTransitions";

export type MobileVideoRenderPayload = {
  projectName: string;
  scenes: Scene[];
  exportSettings: ExportSettings;
};

export type MobileVideoPlaybackState = {
  scene: Scene | null;
  progress: number;
  nextScene: Scene | null;
  transitionProgress: number;
  totalDurationInSeconds: number;
  hasAnnouncementTransitions: boolean;
};

export function getMobileVideoDimensions(settings: ExportSettings) {
  return exportResolutionDimensions[settings.resolution];
}

export function getMobileVideoTotalDurationInSeconds(payload: MobileVideoRenderPayload) {
  const hasAnnouncementTransitions = payload.scenes.some((scene) => isAnnouncementScene(scene));

  return payload.scenes.reduce(
    (sum, scene, index) => sum + scene.durationSeconds + (hasAnnouncementTransitions && index < payload.scenes.length - 1 ? payload.exportSettings.transitionSeconds : 0),
    0,
  );
}

export function getMobileVideoDurationInFrames(payload: MobileVideoRenderPayload) {
  const durationInSeconds = getMobileVideoTotalDurationInSeconds(payload);
  return Math.max(1, Math.ceil(durationInSeconds * payload.exportSettings.fps));
}

export function getMobileVideoPlaybackState(payload: MobileVideoRenderPayload, currentTimeInSeconds: number): MobileVideoPlaybackState {
  const { scenes, exportSettings } = payload;
  const hasAnnouncementTransitions = scenes.some((scene) => isAnnouncementScene(scene));
  const totalDurationInSeconds = getMobileVideoTotalDurationInSeconds(payload);

  if (scenes.length === 0) {
    return {
      scene: null,
      progress: 1,
      nextScene: null,
      transitionProgress: 0,
      totalDurationInSeconds,
      hasAnnouncementTransitions,
    };
  }

  let elapsed = 0;

  for (const [index, scene] of scenes.entries()) {
    const start = elapsed;
    const stillEnd = elapsed + scene.durationSeconds;
    const nextScene = scenes[index + 1] ?? null;
    const canAnimateTransition = hasAnnouncementTransitions && Boolean(nextScene);
    const transitionEnd = stillEnd + (canAnimateTransition ? exportSettings.transitionSeconds : 0);

    if (currentTimeInSeconds <= stillEnd) {
      return {
        scene,
        progress: scene.durationSeconds > 0 ? Math.min(1, Math.max(0, (currentTimeInSeconds - start) / scene.durationSeconds)) : 1,
        nextScene: null,
        transitionProgress: 0,
        totalDurationInSeconds,
        hasAnnouncementTransitions,
      };
    }

    if (canAnimateTransition && nextScene && currentTimeInSeconds <= transitionEnd) {
      return {
        scene,
        progress: 1,
        nextScene,
        transitionProgress: exportSettings.transitionSeconds > 0 ? Math.min(1, Math.max(0, (currentTimeInSeconds - stillEnd) / exportSettings.transitionSeconds)) : 1,
        totalDurationInSeconds,
        hasAnnouncementTransitions,
      };
    }

    elapsed = transitionEnd;
  }

  return {
    scene: scenes[scenes.length - 1] ?? null,
    progress: 1,
    nextScene: null,
    transitionProgress: 0,
    totalDurationInSeconds,
    hasAnnouncementTransitions,
  };
}

export function getTransitionLayerStyle(
  transitionType: Scene["transition"],
  phase: "current" | "next",
  progress: number,
  width: number,
  height: number,
) {
  const motion = getTransitionFrameMotion(transitionType, progress, width, height);

  return phase === "current"
    ? {
        transform: `translate(${motion.currentX}px, ${motion.currentY}px) scale(${motion.currentScale})`,
        opacity: motion.currentOpacity,
      }
    : {
        transform: `translate(${motion.nextX}px, ${motion.nextY}px) scale(${motion.nextScale})`,
        opacity: motion.nextOpacity,
      };
}

export function toSafeMobileVideoFileName(projectName?: string) {
  const baseName = (projectName ?? "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();

  return `${baseName || "video-project"}.mp4`;
}
