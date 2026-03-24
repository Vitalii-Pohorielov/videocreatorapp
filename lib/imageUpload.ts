"use client";

import { uploadProjectImage } from "@/lib/projectPersistence";
import type { ExportProfile, ExportResolution } from "@/lib/sceneDefinitions";
import { exportResolutionDimensions } from "@/lib/sceneDefinitions";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export function fileToDataUrl(file: File) {
  return readFileAsDataUrl(file);
}

function getOutputMimeType(file: File) {
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/jpeg" || file.type === "image/jpg") return "image/jpeg";
  return "image/webp";
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
}

function getImageCompressionConfig(resolution: ExportResolution, profile: ExportProfile) {
  const { width } = exportResolutionDimensions[resolution];
  switch (profile) {
    case "draft":
      return { maxDimension: Math.round(width * 2.4), quality: 0.9 };
    case "high":
      return { maxDimension: Math.round(width * 4.2), quality: 0.98 };
    default:
      return { maxDimension: Math.round(width * 3.2), quality: 0.95 };
  }
}

export async function fileToOptimizedDataUrl(file: File, resolution: ExportResolution, profile: ExportProfile) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  if (!file.type.startsWith("image/")) return sourceDataUrl;

  try {
    const image = await loadImage(sourceDataUrl);
    const { maxDimension, quality } = getImageCompressionConfig(resolution, profile);
    const mimeType = getOutputMimeType(file);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return sourceDataUrl;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    return mimeType === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL(mimeType, quality);
  } catch {
    return sourceDataUrl;
  }
}

async function optimizeImageFile(file: File, resolution: ExportResolution, profile: ExportProfile) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  if (!file.type.startsWith("image/")) return file;

  try {
    const image = await loadImage(sourceDataUrl);
    const { maxDimension, quality } = getImageCompressionConfig(resolution, profile);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));
    const mimeType = getOutputMimeType(file);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });

    if (!blob) return file;

    const extension = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "upload"}.${extension}`, { type: mimeType });
  } catch {
    return file;
  }
}

export async function fileToStoredUrl(file: File, resolution: ExportResolution, profile: ExportProfile) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return fileToOptimizedDataUrl(file, resolution, profile);
  }

  const optimizedFile = await optimizeImageFile(file, resolution, profile);
  return uploadProjectImage(optimizedFile);
}
