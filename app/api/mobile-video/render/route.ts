import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

import { NextResponse } from "next/server";

import { toSafeMobileVideoFileName, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isMobileVideoRenderPayload(value: unknown): value is MobileVideoRenderPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<MobileVideoRenderPayload>;

  return typeof payload.projectName === "string" && Array.isArray(payload.scenes) && Boolean(payload.exportSettings && typeof payload.exportSettings === "object");
}

export async function POST(request: Request) {
  const renderDirectory = path.join(tmpdir(), "video-creator-app", "mobile-video-renders");
  const outputPath = path.join(renderDirectory, `${crypto.randomUUID()}.mp4`);

  try {
    const body = (await request.json()) as unknown;

    if (!isMobileVideoRenderPayload(body)) {
      return NextResponse.json({ error: "Invalid mobile video render payload." }, { status: 400 });
    }

    await fs.mkdir(renderDirectory, { recursive: true });
    const { renderMobileVideoToFile } = await import("@/lib/mobileVideoServerRender");
    await renderMobileVideoToFile(body, outputPath);

    const buffer = await fs.readFile(outputPath);
    const fileName = toSafeMobileVideoFileName(body.projectName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": "video/mp4",
        "content-disposition": `attachment; filename="${fileName}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not render mobile video.";
    console.error("[mobile-video/render] Render failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await fs.unlink(outputPath).catch(() => undefined);
  }
}
