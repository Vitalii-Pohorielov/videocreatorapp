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

  if (!job.archive) {
    return NextResponse.json({ error: "ZIP archive is not ready yet." }, { status: 409 });
  }

  return new NextResponse(new Uint8Array(job.archive), {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="express-video-generation.zip"`,
      "cache-control": "no-store",
    },
  });
}
