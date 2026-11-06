import { NextResponse } from "next/server";

import { remoteImageToDataUrl } from "@/lib/remoteImageDataUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; referer?: string };
    const imageUrl = (body.url ?? "").trim();
    if (!imageUrl) return NextResponse.json({ error: "Logo URL is missing." }, { status: 400 });

    const dataUrl = await remoteImageToDataUrl(imageUrl, body.referer);
    if (!dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Could not embed the logo for browser rendering." }, { status: 422 });
    }

    return NextResponse.json({ dataUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare the logo for browser rendering.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
