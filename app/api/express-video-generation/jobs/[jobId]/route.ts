import { NextResponse } from "next/server";

import { getExpressVideoJob } from "@/lib/expressVideoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = getExpressVideoJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Batch job not found." }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    isDownloadReady: Boolean(job.archive),
  });
}
