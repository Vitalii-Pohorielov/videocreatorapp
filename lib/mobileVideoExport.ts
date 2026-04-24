import type { ExportSettings, Scene } from "@/lib/sceneDefinitions";
import { toSafeMobileVideoFileName, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

type MobileVideoRenderEvent =
  | { type: "phase"; phase: string; progress: number; subtitle?: string }
  | { type: "done"; url: string; fileName: string; size: number }
  | { type: "error"; message: string };

type MobileVideoExportProgress = {
  progress: number;
  phase: string;
  subtitle?: string;
};

function parseSseChunk(buffer: string) {
  const events: MobileVideoRenderEvent[] = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    const line = part
      .split("\n")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("data:"));

    if (!line) continue;

    const json = line.slice(5).trim();
    if (!json) continue;

    events.push(JSON.parse(json) as MobileVideoRenderEvent);
  }

  return { events, remainder };
}

export async function exportMobileVideo(
  payload: MobileVideoRenderPayload,
  onProgress?: (progress: MobileVideoExportProgress) => void,
) {
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

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream")) {
    throw new Error("Mobile video render route returned an unexpected response type.");
  }

  if (!response.body) {
    throw new Error("Mobile video render stream is not available in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.remainder;

    for (const event of parsed.events) {
      if (event.type === "phase") {
        onProgress?.({
          progress: event.progress,
          phase: event.phase,
          subtitle: event.subtitle,
        });
        continue;
      }

      if (event.type === "error") {
        throw new Error(event.message);
      }

      return {
        url: event.url,
        fileName: event.fileName || toSafeMobileVideoFileName(payload.projectName),
      };
    }
  }

  throw new Error("Mobile video render finished without a download URL.");
}

export function createMobileVideoRenderPayload(projectName: string, scenes: Scene[], exportSettings: ExportSettings): MobileVideoRenderPayload {
  return {
    projectName,
    scenes,
    exportSettings,
  };
}
