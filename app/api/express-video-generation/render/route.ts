import { NextResponse } from "next/server";

import { BatchRequestError, parseExpressBatchUrls, renderExpressVideoBatch } from "@/lib/expressVideoBatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const urls = parseExpressBatchUrls((await request.json()) as { urls?: unknown });
    const archive = await renderExpressVideoBatch(urls);

    return new NextResponse(archive, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="express-video-generation.zip"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate the video batch.";
    if (error instanceof BatchRequestError) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("[express-video-generation] Batch render failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
