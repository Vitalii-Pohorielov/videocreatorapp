import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { renderMobileVideoToFile } from "@/lib/mobileVideoServerRender";
import { toSafeMobileVideoFileName } from "@/lib/mobileVideoRender";
import type { ExportSettings, SceneTrack } from "@/lib/sceneDefinitions";
import { generateProjectFromUrl, type GeneratedProjectPayload } from "@/lib/siteGenerator";

export type ExpressBatchPhase = "queued" | "scraping" | "rendering" | "zipping" | "done" | "error";

export type ExpressBatchProgress = {
  phase: ExpressBatchPhase;
  current: number;
  total: number;
  completed: number;
  currentUrl: string | null;
  currentFileName: string | null;
  message: string;
};

type BatchRenderRequest = {
  urls?: unknown;
  projects?: unknown;
};

type ZipFile = {
  name: string;
  data: Buffer;
};

export const MAX_EXPRESS_BATCH_URLS = 10;

export class BatchRequestError extends Error {}

export type ExpressPreparedProject = GeneratedProjectPayload & {
  sourceUrl: string;
  logoImageUrl: string;
};

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function getCrc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosDate, dosTime };
}

export function createZipArchive(files: ZipFile[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  const { dosDate, dosTime } = getDosDateTime();
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, "utf8");
    const crc32 = getCrc32(file.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc32, 14);
    localHeader.writeUInt32LE(file.data.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, file.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc32, 16);
    centralHeader.writeUInt32LE(file.data.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + file.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

export function parseExpressBatchUrls(body: BatchRenderRequest) {
  if (!Array.isArray(body.urls)) {
    throw new BatchRequestError("Provide an array of website URLs.");
  }

  const seen = new Set<string>();
  const urls = body.urls
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .filter((url) => {
      const key = url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (urls.length === 0) {
    throw new BatchRequestError("Add at least one website URL.");
  }

  if (urls.length > MAX_EXPRESS_BATCH_URLS) {
    throw new BatchRequestError(`Use ${MAX_EXPRESS_BATCH_URLS} URLs or fewer per batch.`);
  }

  return urls;
}

function isPreparedProject(value: unknown): value is ExpressPreparedProject {
  if (!value || typeof value !== "object") return false;

  const project = value as Partial<ExpressPreparedProject>;
  const sceneTrack = project.sceneTrack as Partial<SceneTrack> | undefined;
  const exportSettings = project.exportSettings as Partial<ExportSettings> | undefined;

  return (
    typeof project.sourceUrl === "string" &&
    typeof project.projectName === "string" &&
    typeof project.logoImageUrl === "string" &&
    Boolean(sceneTrack && sceneTrack.id === "main-track" && Array.isArray(sceneTrack.scenes)) &&
    Boolean(exportSettings && typeof exportSettings === "object")
  );
}

export function parseExpressPreparedProjects(body: BatchRenderRequest) {
  if (!Array.isArray(body.projects)) {
    throw new BatchRequestError("Provide an array of prepared projects.");
  }

  const seen = new Set<string>();
  const projects = body.projects
    .filter(isPreparedProject)
    .map((project) => ({
      ...project,
      sourceUrl: project.sourceUrl.trim(),
      projectName: project.projectName.trim() || "Video project",
      logoImageUrl: project.logoImageUrl.trim(),
    }))
    .filter((project) => {
      const key = project.sourceUrl.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (projects.length === 0) {
    throw new BatchRequestError("Prepare at least one website project first.");
  }

  if (projects.length > MAX_EXPRESS_BATCH_URLS) {
    throw new BatchRequestError(`Use ${MAX_EXPRESS_BATCH_URLS} projects or fewer per batch.`);
  }

  return projects;
}

function getUniqueFileName(fileName: string, usedNames: Set<string>) {
  const parsed = path.parse(fileName);
  let candidate = fileName;
  let index = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${parsed.name}-${index}${parsed.ext}`;
    index += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function applyPreparedProjectEdits(project: ExpressPreparedProject): GeneratedProjectPayload {
  const projectName = project.projectName.trim() || "Video project";
  const logoImageUrl = project.logoImageUrl.trim();

  return {
    projectName,
    exportSettings: project.exportSettings,
    sceneTrack: {
      ...project.sceneTrack,
      scenes: project.sceneTrack.scenes.map((scene) => {
        if (scene.type === "brand-reveal" || scene.type === "brand-reveal-alt" || scene.type === "brand-reveal-circle") {
          return {
            ...scene,
            title: projectName,
            logoImageUrl,
          };
        }

        return scene.logoImageUrl
          ? {
              ...scene,
              logoImageUrl,
            }
          : scene;
      }),
    },
  };
}

async function buildProjectFromBatchItem(item: string | ExpressPreparedProject) {
  if (typeof item === "string") {
    return {
      sourceUrl: item,
      project: await generateProjectFromUrl(item),
    };
  }

  return {
    sourceUrl: item.sourceUrl,
    project: applyPreparedProjectEdits(item),
  };
}

export async function renderExpressVideoBatch(
  batchItems: Array<string | ExpressPreparedProject>,
  onProgress?: (progress: ExpressBatchProgress) => void,
) {
  const batchDirectory = path.join(tmpdir(), "video-creator-app", "express-video-generation", randomUUID());

  try {
    await fs.mkdir(batchDirectory, { recursive: true });

    const files: ZipFile[] = [];
    const usedNames = new Set<string>();

    onProgress?.({
      phase: "queued",
      current: 0,
      total: batchItems.length,
      completed: 0,
      currentUrl: null,
      currentFileName: null,
      message: `Queued ${batchItems.length} project${batchItems.length === 1 ? "" : "s"}.`,
    });

    for (const [index, item] of batchItems.entries()) {
      const current = index + 1;
      const sourceUrl = typeof item === "string" ? item : item.sourceUrl;

      onProgress?.({
        phase: "scraping",
        current,
        total: batchItems.length,
        completed: files.length,
        currentUrl: sourceUrl,
        currentFileName: null,
        message: typeof item === "string" ? `Scraping ${current}/${batchItems.length}: ${sourceUrl}` : `Preparing ${current}/${batchItems.length}: ${sourceUrl}`,
      });

      const { project: generatedProject } = await buildProjectFromBatchItem(item);
      const outputPath = path.join(batchDirectory, `${current}-${randomUUID()}.mp4`);
      const baseFileName = toSafeMobileVideoFileName(generatedProject.projectName);
      const fileName = getUniqueFileName(`${String(current).padStart(2, "0")}-${baseFileName}`, usedNames);

      onProgress?.({
        phase: "rendering",
        current,
        total: batchItems.length,
        completed: files.length,
        currentUrl: sourceUrl,
        currentFileName: fileName,
        message: `Rendering ${current}/${batchItems.length}: ${fileName}`,
      });

      await renderMobileVideoToFile(
        {
          projectName: generatedProject.projectName,
          scenes: generatedProject.sceneTrack.scenes,
          exportSettings: generatedProject.exportSettings,
        },
        outputPath,
      );

      const videoBuffer = await fs.readFile(outputPath);
      files.push({ name: fileName, data: videoBuffer });

      onProgress?.({
        phase: "rendering",
        current,
        total: batchItems.length,
        completed: files.length,
        currentUrl: sourceUrl,
        currentFileName: fileName,
        message: `Done ${files.length}/${batchItems.length}: ${fileName}`,
      });
    }

    onProgress?.({
      phase: "zipping",
      current: batchItems.length,
      total: batchItems.length,
      completed: files.length,
      currentUrl: null,
      currentFileName: "express-video-generation.zip",
      message: `Preparing ZIP archive with ${files.length} video${files.length === 1 ? "" : "s"}.`,
    });

    return createZipArchive(files);
  } finally {
    await fs.rm(batchDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
}
