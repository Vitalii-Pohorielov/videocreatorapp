import { addBundleToSandbox, createSandbox, renderMediaOnVercel, uploadToVercelBlob } from "@remotion/vercel";
import { waitUntil } from "@vercel/functions";

import { toSafeMobileVideoFileName, type MobileVideoRenderPayload } from "@/lib/mobileVideoRender";

import { ensureLocalRemotionBundle, formatSseEvent, type MobileVideoRenderEvent } from "./helpers";
import { restoreSnapshot } from "./restore-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    return Response.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN is not set. Attach a Vercel Blob store to this project and pull the env locally with `vercel env pull .env.local`.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as unknown;

  if (!isMobileVideoRenderPayload(body)) {
    return Response.json({ error: "Invalid mobile video render payload." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const fileName = toSafeMobileVideoFileName(body.projectName);
  const blobPath = `mobile-video-renders/${crypto.randomUUID()}-${fileName}`;

  const send = async (message: MobileVideoRenderEvent) => {
    await writer.write(encoder.encode(formatSseEvent(message)));
  };

  const runRender = async () => {
    let sandbox: Awaited<ReturnType<typeof createSandbox>> | null = null;
    let shouldUploadBundle = false;

    try {
      if (process.env.VERCEL) {
        await send({ type: "phase", phase: "Preparing sandbox...", progress: 0.03 });

        try {
          sandbox = await restoreSnapshot(blobToken);
        } catch {
          await send({
            type: "phase",
            phase: "Creating fresh sandbox...",
            progress: 0.08,
            subtitle: "Snapshot was unavailable, falling back to a fresh environment.",
          });

          sandbox = await createSandbox();
          shouldUploadBundle = true;
        }
      } else {
        await send({
          type: "phase",
          phase: "Creating local sandbox...",
          progress: 0.03,
          subtitle: "First local render can take a bit longer while the sandbox is prepared.",
        });

        sandbox = await createSandbox({
          onProgress: async ({ progress, message }) => {
            await send({
              type: "phase",
              phase: message,
              progress: Math.min(0.2, 0.03 + progress * 0.17),
              subtitle: "Preparing local Remotion sandbox.",
            });
          },
        });

        shouldUploadBundle = true;
        await send({ type: "phase", phase: "Bundling mobile video project...", progress: 0.24 });
        ensureLocalRemotionBundle();
      }

      if (shouldUploadBundle) {
        if (process.env.VERCEL) {
          await send({
            type: "phase",
            phase: "Uploading bundled project...",
            progress: 0.24,
            subtitle: "Snapshot fallback is active for this render.",
          });
        } else {
          await send({ type: "phase", phase: "Uploading bundle to sandbox...", progress: 0.32 });
        }

        await addBundleToSandbox({
          sandbox,
          bundleDir: ".remotion-vercel-bundle",
        });
      }

      const { sandboxFilePath, contentType } = await renderMediaOnVercel({
        sandbox,
        compositionId: "MobileVideo",
        inputProps: { payload: body },
        codec: "h264",
        imageFormat: "jpeg",
        jpegQuality: 95,
        muted: true,
        chromiumOptions: {
          gl: "swiftshader",
        },
        onProgress: async (update) => {
          switch (update.stage) {
            case "opening-browser":
              await send({ type: "phase", phase: "Opening browser...", progress: update.overallProgress });
              break;
            case "selecting-composition":
              await send({ type: "phase", phase: "Selecting composition...", progress: update.overallProgress });
              break;
            case "render-progress":
              await send({ type: "phase", phase: "Rendering video...", progress: update.overallProgress });
              break;
            default:
              break;
          }
        },
      });

      await send({ type: "phase", phase: "Uploading video...", progress: 0.98 });

      const { url, size } = await uploadToVercelBlob({
        sandbox,
        sandboxFilePath,
        blobPath,
        contentType,
        blobToken,
        access: "public",
      });

      await send({ type: "done", url, fileName, size });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not render mobile video.";
      await send({ type: "error", message });
    } finally {
      await sandbox?.stop().catch(() => undefined);
      await writer.close();
    }
  };

  waitUntil(runRender());

  return new Response(stream.readable, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
