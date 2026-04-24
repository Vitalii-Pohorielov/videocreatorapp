import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { NextResponse } from "next/server";

import { toSafeMobileVideoFileName, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMobileVideoRenderPayload(value: unknown): value is MobileVideoRenderPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<MobileVideoRenderPayload>;

  return (
    typeof payload.projectName === "string" &&
    Array.isArray(payload.scenes) &&
    Boolean(payload.exportSettings && typeof payload.exportSettings === "object")
  );
}

async function runMobileVideoRenderProcess(payloadPath: string, outputPath: string) {
  const scriptPath = path.join(process.cwd(), "scripts", "render-mobile-video.cjs");

  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, payloadPath, outputPath], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
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

      reject(new Error(stderr.trim() || `Mobile video render process exited with code ${code}.`));
    });
  });
}

export async function POST(request: Request) {
  const renderDirectory = path.join(tmpdir(), "video-creator-app", "mobile-video-renders");
  const payloadPath = path.join(renderDirectory, `${crypto.randomUUID()}.json`);
  const outputPath = path.join(renderDirectory, `${crypto.randomUUID()}.mp4`);

  try {
    const body = (await request.json()) as unknown;

    if (!isMobileVideoRenderPayload(body)) {
      return NextResponse.json({ error: "Invalid mobile video render payload." }, { status: 400 });
    }

    await fs.mkdir(renderDirectory, { recursive: true });
    await fs.writeFile(payloadPath, JSON.stringify(body), "utf8");
    await runMobileVideoRenderProcess(payloadPath, outputPath);

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
    await fs.unlink(payloadPath).catch(() => undefined);
    await fs.unlink(outputPath).catch(() => undefined);
  }
}
