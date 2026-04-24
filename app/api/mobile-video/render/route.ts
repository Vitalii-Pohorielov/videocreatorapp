import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";

import { NextResponse } from "next/server";

import { toSafeMobileVideoFileName, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";
import { renderMobileVideoOnVercel } from "@/lib/mobileVideoVercelRender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function renderMobileVideoLocally(payload: MobileVideoRenderPayload, outputPath: string) {
  const renderDirectory = path.dirname(outputPath);
  const payloadPath = path.join(renderDirectory, `${crypto.randomUUID()}.json`);

  try {
    await fs.writeFile(payloadPath, JSON.stringify(payload), "utf8");

    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(process.cwd(), "scripts", "render-mobile-video.cjs"), payloadPath, outputPath], {
        cwd: process.cwd(),
        stdio: ["ignore", "ignore", "pipe"],
      });

      let stderr = "";

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(stderr.trim() || `Local Remotion render failed with exit code ${code}.`));
      });
    });
  } finally {
    await fs.unlink(payloadPath).catch(() => undefined);
  }
}

function isMobileVideoRenderPayload(value: unknown): value is MobileVideoRenderPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<MobileVideoRenderPayload>;

  return (
    typeof payload.projectName === "string" &&
    Array.isArray(payload.scenes) &&
    Boolean(payload.exportSettings && typeof payload.exportSettings === "object")
  );
}

export async function POST(request: Request) {
  const renderDirectory = path.join(tmpdir(), "video-creator-app", "mobile-video-renders");
  const outputPath = path.join(renderDirectory, `${crypto.randomUUID()}.mp4`);

  try {
    const body = (await request.json()) as unknown;

    if (!isMobileVideoRenderPayload(body)) {
      return NextResponse.json({ error: "Invalid mobile video render payload." }, { status: 400 });
    }

    if (process.env.VERCEL) {
      const result = await renderMobileVideoOnVercel(body);
      return NextResponse.json(result, {
        status: 200,
        headers: {
          "cache-control": "no-store",
        },
      });
    }

    await fs.mkdir(renderDirectory, { recursive: true });
    await renderMobileVideoLocally(body, outputPath);

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
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await fs.unlink(outputPath).catch(() => undefined);
  }
}
