import "@/remotion/generated.css";

import { Composition, registerRoot } from "remotion";

import { getMobileVideoDimensions, getMobileVideoDurationInFrames, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";
import { MobileVideoComposition } from "@/remotion/MobileVideoComposition";

const defaultPayload: MobileVideoRenderPayload = {
  projectName: "Untitled mobile video",
  scenes: [],
  exportSettings: {
    fps: 30,
    transitionSeconds: 0.8,
    backgroundColor: "#ffffff",
    textColor: "#111111",
    accentColor: "#4b5563",
    fontChoice: "jakarta",
    preset: "white",
    resolution: "720p",
    profile: "standard",
  },
};

function RemotionRoot() {
  return (
    <Composition
      id="MobileVideo"
      component={MobileVideoComposition}
      defaultProps={{ payload: defaultPayload }}
      calculateMetadata={({ props }) => {
        const payload = props.payload;
        const { width, height } = getMobileVideoDimensions(payload.exportSettings);

        return {
          width,
          height,
          fps: payload.exportSettings.fps,
          durationInFrames: getMobileVideoDurationInFrames(payload),
        };
      }}
    />
  );
}

registerRoot(RemotionRoot);
