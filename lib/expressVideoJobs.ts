import { randomUUID } from "node:crypto";

import {
  type ExpressPreparedProject,
  type ExpressBatchProgress,
  type ExpressBatchPhase,
  renderExpressVideoBatch,
} from "@/lib/expressVideoBatch";

export type ExpressVideoJob = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: Extract<ExpressBatchPhase, "queued" | "scraping" | "rendering" | "zipping" | "done" | "error">;
  progress: ExpressBatchProgress;
  archive: Buffer | null;
  error: string | null;
};

const jobs = new Map<string, ExpressVideoJob>();

function createInitialProgress(total: number): ExpressBatchProgress {
  return {
    phase: "queued",
    current: 0,
    total,
    completed: 0,
    currentUrl: null,
    currentFileName: null,
    message: `Queued ${total} project${total === 1 ? "" : "s"}.`,
  };
}

function pruneOldJobs() {
  const cutoff = Date.now() - 1000 * 60 * 60;

  for (const [jobId, job] of jobs.entries()) {
    if (job.updatedAt < cutoff) {
      jobs.delete(jobId);
    }
  }
}

export function startExpressVideoJob(batchItems: Array<string | ExpressPreparedProject>) {
  pruneOldJobs();

  const now = Date.now();
  const job: ExpressVideoJob = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "queued",
    progress: createInitialProgress(batchItems.length),
    archive: null,
    error: null,
  };

  jobs.set(job.id, job);

  void renderExpressVideoBatch(batchItems, (progress) => {
    job.status = progress.phase;
    job.progress = progress;
    job.updatedAt = Date.now();
  })
    .then((archive) => {
      job.archive = archive;
      job.status = "done";
      job.progress = {
        phase: "done",
        current: batchItems.length,
        total: batchItems.length,
        completed: batchItems.length,
        currentUrl: null,
        currentFileName: "express-video-generation.zip",
        message: `Done ${batchItems.length}/${batchItems.length}. ZIP is ready.`,
      };
      job.updatedAt = Date.now();
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Could not generate the video batch.";
      job.error = message;
      job.status = "error";
      job.progress = {
        ...job.progress,
        phase: "error",
        message,
      };
      job.updatedAt = Date.now();
      console.error("[express-video-generation] Job failed", error);
    });

  return job;
}

export function getExpressVideoJob(jobId: string) {
  pruneOldJobs();
  return jobs.get(jobId) ?? null;
}
