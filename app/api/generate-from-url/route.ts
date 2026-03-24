import { NextResponse } from "next/server";

import { generateProjectFromUrl } from "@/lib/siteGenerator";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const result = await generateProjectFromUrl(body.url ?? "");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate scenes from that URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
