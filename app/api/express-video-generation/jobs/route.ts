import { NextResponse } from "next/server";

import { BatchRequestError, parseExpressBatchUrls, parseExpressPreparedProjects } from "@/lib/expressVideoBatch";
import { startExpressVideoJob } from "@/lib/expressVideoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { urls?: unknown; projects?: unknown };
    const batchItems = Array.isArray(body.projects) ? parseExpressPreparedProjects(body) : parseExpressBatchUrls(body);
    const job = startExpressVideoJob(batchItems);

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start the video batch.";
    if (error instanceof BatchRequestError) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("[express-video-generation] Could not start job", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
