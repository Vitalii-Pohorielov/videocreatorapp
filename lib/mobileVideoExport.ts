import type { ExportSettings, Scene } from "@/lib/sceneDefinitions";
import type { MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

function getFileNameFromDisposition(disposition: string | null) {
  if (!disposition) return null;

  const match = disposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? null;
}

export async function exportMobileVideo(payload: MobileVideoRenderPayload) {
  const response = await fetch("/api/mobile-video/render", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Could not render mobile video.";

    try {
      const errorPayload = (await response.json()) as { error?: string };
      if (errorPayload.error) message = errorPayload.error;
    } catch {
      // Ignore JSON parse failure and fall back to a generic message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const fileName = getFileNameFromDisposition(response.headers.get("content-disposition")) ?? "mobile-video-project.mp4";

  return {
    url: URL.createObjectURL(blob),
    fileName,
  };
}

export function createMobileVideoRenderPayload(projectName: string, scenes: Scene[], exportSettings: ExportSettings): MobileVideoRenderPayload {
  return {
    projectName,
    scenes,
    exportSettings,
  };
}
