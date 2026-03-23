"use client";

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
      return { maxDimension: Math.round(width * 1.05), quality: 0.72 };
    case "high":
      return { maxDimension: Math.round(width * 1.8), quality: 0.92 };
    default:
      return { maxDimension: Math.round(width * 1.35), quality: 0.82 };
  }
}

export async function fileToOptimizedDataUrl(file: File, resolution: ExportResolution, profile: ExportProfile) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  if (!file.type.startsWith("image/")) return sourceDataUrl;

  try {
    const image = await loadImage(sourceDataUrl);
    const { maxDimension, quality } = getImageCompressionConfig(resolution, profile);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return sourceDataUrl;

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL("image/webp", quality);
  } catch {
    return sourceDataUrl;
  }
}
