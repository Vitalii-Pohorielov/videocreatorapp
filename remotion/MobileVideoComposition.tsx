"use client";

import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";

import { SceneStage } from "@/components/SceneStage";
import {
  getMobileVideoDimensions,
  getMobileVideoPlaybackState,
  getTransitionLayerStyle,
  type MobileVideoRenderPayload,
} from "@/lib/mobileVideoRender";

type MobileVideoCompositionProps = {
  payload: MobileVideoRenderPayload;
};

export function MobileVideoComposition({ payload }: MobileVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { exportSettings } = payload;
  const { width, height } = getMobileVideoDimensions(exportSettings);
  const currentTimeInSeconds = frame / exportSettings.fps;
  const playbackState = getMobileVideoPlaybackState(payload, currentTimeInSeconds);
  const activeScene = playbackState.scene;
  const isTransitioning = Boolean(activeScene && playbackState.nextScene && playbackState.transitionProgress > 0);
  const announcementVideoBackgroundSrc = staticFile("scene-assets/announcement-backgrounds/announcement-hero-bg.mp4");

  if (!activeScene) {
    return <AbsoluteFill style={{ backgroundColor: exportSettings.backgroundColor }} />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: exportSettings.backgroundColor }}>
      {isTransitioning && playbackState.nextScene ? (
        <>
          <AbsoluteFill style={getTransitionLayerStyle(activeScene.transition, "current", playbackState.transitionProgress, width, height)}>
            <AbsoluteFill>
              <SceneStage
                scene={activeScene}
                backgroundColor={exportSettings.backgroundColor}
                accentColor={exportSettings.accentColor}
                textColor={exportSettings.textColor}
                fontChoice={exportSettings.fontChoice}
                preset={exportSettings.preset}
                performanceMode="export"
                renderLayer="background"
                progress={1}
                uploadResolution={exportSettings.resolution}
                uploadProfile={exportSettings.profile}
                renderVideoBackground
                videoBackgroundSrc={announcementVideoBackgroundSrc}
              />
            </AbsoluteFill>
            <AbsoluteFill>
              <SceneStage
                scene={activeScene}
                backgroundColor={exportSettings.backgroundColor}
                accentColor={exportSettings.accentColor}
                textColor={exportSettings.textColor}
                fontChoice={exportSettings.fontChoice}
                preset={exportSettings.preset}
                performanceMode="export"
                renderLayer="content"
                progress={1}
                uploadResolution={exportSettings.resolution}
                uploadProfile={exportSettings.profile}
                renderVideoBackground
                videoBackgroundSrc={announcementVideoBackgroundSrc}
              />
            </AbsoluteFill>
          </AbsoluteFill>

          <AbsoluteFill style={getTransitionLayerStyle(activeScene.transition, "next", playbackState.transitionProgress, width, height)}>
            <AbsoluteFill>
              <SceneStage
                scene={playbackState.nextScene}
                backgroundColor={exportSettings.backgroundColor}
                accentColor={exportSettings.accentColor}
                textColor={exportSettings.textColor}
                fontChoice={exportSettings.fontChoice}
                preset={exportSettings.preset}
                performanceMode="export"
                renderLayer="background"
                progress={1}
                uploadResolution={exportSettings.resolution}
                uploadProfile={exportSettings.profile}
                renderVideoBackground
                videoBackgroundSrc={announcementVideoBackgroundSrc}
              />
            </AbsoluteFill>
            <AbsoluteFill>
              <SceneStage
                scene={playbackState.nextScene}
                backgroundColor={exportSettings.backgroundColor}
                accentColor={exportSettings.accentColor}
                textColor={exportSettings.textColor}
                fontChoice={exportSettings.fontChoice}
                preset={exportSettings.preset}
                performanceMode="export"
                renderLayer="content"
                progress={0}
                uploadResolution={exportSettings.resolution}
                uploadProfile={exportSettings.profile}
                renderVideoBackground
                videoBackgroundSrc={announcementVideoBackgroundSrc}
              />
            </AbsoluteFill>
          </AbsoluteFill>
        </>
      ) : (
        <>
          <AbsoluteFill>
            <SceneStage
              scene={activeScene}
              backgroundColor={exportSettings.backgroundColor}
              accentColor={exportSettings.accentColor}
              textColor={exportSettings.textColor}
              fontChoice={exportSettings.fontChoice}
              preset={exportSettings.preset}
              performanceMode="export"
              renderLayer="background"
              progress={1}
              uploadResolution={exportSettings.resolution}
              uploadProfile={exportSettings.profile}
              renderVideoBackground
              videoBackgroundSrc={announcementVideoBackgroundSrc}
            />
          </AbsoluteFill>
          <AbsoluteFill>
            <SceneStage
              scene={activeScene}
              backgroundColor={exportSettings.backgroundColor}
              accentColor={exportSettings.accentColor}
              textColor={exportSettings.textColor}
              fontChoice={exportSettings.fontChoice}
              preset={exportSettings.preset}
              performanceMode="export"
              renderLayer="content"
              progress={playbackState.progress}
              uploadResolution={exportSettings.resolution}
              uploadProfile={exportSettings.profile}
              renderVideoBackground
              videoBackgroundSrc={announcementVideoBackgroundSrc}
            />
          </AbsoluteFill>
        </>
      )}
    </AbsoluteFill>
  );
}
