import { NextResponse } from "next/server";

import { captureWebsiteScreenshotDataUrl } from "@/lib/websiteScreenshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const screenshotImageUrl = await captureWebsiteScreenshotDataUrl(body.url ?? "");
    return NextResponse.json({ screenshotImageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not capture website screenshot.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
