"use client";

import { useEffect, useState, type CSSProperties, type ElementType, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

import { CodeEditorModal } from "@/components/CodeEditorModal";
import { CodePreviewCard } from "@/components/CodePreviewCard";
import { AnimatedIconPlayer } from "@/components/AnimatedIconPlayer";
import { EmojiAssetPicker } from "@/components/EmojiAssetPicker";
import { fileToStoredUrl } from "@/lib/imageUpload";
import type { ExportProfile, ExportResolution, Scene, TemplatePreset } from "@/store/useStore";

type SceneStageProps = {
  scene: Scene;
  backgroundColor: string;
  textColor: string;
  preset: TemplatePreset;
  performanceMode?: "full" | "light";
  renderLayer?: "full" | "background" | "content";
  progress?: number;
  compact?: boolean;
  editable?: boolean;
  onSceneChange?: (updates: Partial<Omit<Scene, "id" | "type">>) => void;
  onRequestLogoUpload?: () => void;
  onRequestHighlightUpload?: () => void;
  onRequestAuthorUpload?: () => void;
  uploadResolution?: ExportResolution;
  uploadProfile?: ExportProfile;
};

function getRenderableImageUrl(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "." || trimmed === "/") return "";
  if (/^https?:\/\/[^/]+\/\.?$/.test(trimmed)) return "";
  return trimmed;
}

function isAnimatedIconUrl(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.endsWith(".json") || trimmed.includes(".json?");
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value: number) {
  const t = clamp(value);
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(value: number) {
  const t = clamp(value);
  return t * t * t;
}

function motion(progress: number, delay = 0, span = 1) {
  return easeOutCubic(clamp((progress - delay) / span));
}

function outroMotion(progress: number, delay = 0, span = 1) {
  return easeInCubic(clamp((progress - delay) / span));
}

function revealStyle(progress: number, options?: { y?: number; x?: number; scaleFrom?: number; blur?: number; minOpacity?: number }): CSSProperties {
  const y = options?.y ?? 18;
  const x = options?.x ?? 0;
  const scaleFrom = options?.scaleFrom ?? 0.98;
  const blur = options?.blur ?? 10;
  const minOpacity = options?.minOpacity ?? 0;

  return {
    transform: `translate(${x * (1 - progress)}px, ${y * (1 - progress)}px) scale(${scaleFrom + progress * (1 - scaleFrom)})`,
    opacity: minOpacity + progress * (1 - minOpacity),
    filter: `blur(${blur * (1 - progress)}px)`,
  };
}

function toSentenceCase(value: string) {
  const normalized = value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.replace(/(^|[.!?]\s+)([a-zа-яё])/giu, (match, prefix, letter: string) => `${prefix}${letter.toUpperCase()}`).replace(/^([a-zа-яё])/iu, (match) => match.toUpperCase());
}

function presetStyles(preset: TemplatePreset, lightweight = false) {
  switch (preset) {
    case "white":
      return {
        card: "bg-white/88 border-black/10 shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
        accent: "bg-black/85",
        title: "font-semibold tracking-[-0.04em]",
        italic: "",
      };
    case "black":
      return {
        card: "bg-white/6 border-white/16 shadow-[0_24px_70px_rgba(0,0,0,0.38)]",
        accent: "bg-white",
        title: "font-semibold tracking-[-0.04em]",
        italic: "",
      };
    case "premium":
      return {
        card: lightweight ? "bg-white/8 border-[#d7b98a]/35 shadow-[0_12px_30px_rgba(5,10,20,0.22)]" : "bg-white/8 border-[#d7b98a]/35 backdrop-blur-md shadow-[0_24px_70px_rgba(5,10,20,0.35)]",
        accent: "bg-[#d7b98a]",
        title: "font-semibold tracking-[-0.04em]",
        italic: "",
      };
    case "bold":
      return {
        card: "bg-white/10 border-[#ffd166]/24 shadow-[0_18px_50px_rgba(0,0,0,0.25)]",
        accent: "bg-[#ffd166]",
        title: "font-black uppercase tracking-[0.02em]",
        italic: "italic",
      };
    case "editorial":
      return {
        card: lightweight ? "bg-white/55 border-black/10 shadow-[0_12px_28px_rgba(60,35,15,0.08)]" : "bg-white/55 border-black/10 backdrop-blur-sm shadow-[0_22px_55px_rgba(60,35,15,0.1)]",
        accent: "bg-[#9a7b4f]",
        title: "font-serif italic tracking-[-0.02em]",
        italic: "italic",
      };
    case "sunset":
      return {
        card: "bg-[#ffedd5]/10 border-[#fb923c]/30 shadow-[0_20px_60px_rgba(251,146,60,0.12)]",
        accent: "bg-[#fb923c]",
        title: "font-black tracking-[-0.04em]",
        italic: "",
      };
    case "mono":
      return {
        card: "bg-white/5 border-white/20 shadow-[0_20px_45px_rgba(255,255,255,0.03)]",
        accent: "bg-white",
        title: "font-medium uppercase tracking-[0.08em]",
        italic: "",
      };
    case "neon-grid":
      return {
        card: lightweight ? "bg-[#08192d]/72 border-[#39f3ff]/28 shadow-[0_0_0_1px_rgba(57,243,255,0.08),0_14px_34px_rgba(0,0,0,0.28)]" : "bg-[#08192d]/72 border-[#39f3ff]/28 backdrop-blur-md shadow-[0_0_0_1px_rgba(57,243,255,0.08),0_28px_80px_rgba(0,0,0,0.45)]",
        accent: "bg-[#39f3ff]",
        title: "font-black uppercase tracking-[0.12em]",
        italic: "",
      };
    case "paper-cut":
      return {
        card: "bg-[#fff8ee] border-[#b05b3b]/18 shadow-[10px_10px_0_rgba(176,91,59,0.14)]",
        accent: "bg-[#d95734]",
        title: "font-black tracking-[-0.04em]",
        italic: "",
      };
    case "arctic-glass":
      return {
        card: lightweight ? "bg-white/24 border-[#7cdcff]/30 shadow-[0_12px_34px_rgba(83,150,200,0.1)]" : "bg-white/28 border-[#7cdcff]/34 backdrop-blur-xl shadow-[0_20px_70px_rgba(83,150,200,0.16)]",
        accent: "bg-[#1479ff]",
        title: "font-semibold tracking-[-0.05em]",
        italic: "",
      };
    case "brutalist":
      return {
        card: "bg-[#fffef2] border-black shadow-[12px_12px_0_rgba(0,0,0,0.88)]",
        accent: "bg-black",
        title: "font-black uppercase tracking-[-0.05em]",
        italic: "",
      };
    case "velvet-noir":
      return {
        card: lightweight ? "bg-[#2a1020]/82 border-[#ff77aa]/25 shadow-[0_14px_38px_rgba(255,34,118,0.12)]" : "bg-[#2a1020]/82 border-[#ff77aa]/25 backdrop-blur-md shadow-[0_24px_90px_rgba(255,34,118,0.18)]",
        accent: "bg-[#ff77aa]",
        title: "font-serif tracking-[-0.04em]",
        italic: "italic",
      };
    case "mint-pop":
      return {
        card: "bg-white/72 border-[#19c6a3]/28 shadow-[0_22px_65px_rgba(25,198,163,0.14)]",
        accent: "bg-[#19c6a3]",
        title: "font-black tracking-[-0.05em]",
        italic: "",
      };
    case "terminal":
      return {
        card: "bg-[#07130c]/88 border-[#2dff72]/24 shadow-[0_0_0_1px_rgba(45,255,114,0.08),0_28px_80px_rgba(0,0,0,0.55)]",
        accent: "bg-[#2dff72]",
        title: "font-mono uppercase tracking-[0.08em]",
        italic: "",
      };
    case "blueprint":
      return {
        card: lightweight ? "bg-[#12345d]/78 border-[#7cd4ff]/26 shadow-[0_14px_38px_rgba(4,14,34,0.28)]" : "bg-[#12345d]/78 border-[#7cd4ff]/26 backdrop-blur-sm shadow-[0_24px_80px_rgba(4,14,34,0.42)]",
        accent: "bg-[#7cd4ff]",
        title: "font-semibold uppercase tracking-[0.12em]",
        italic: "",
      };
    case "acid-pop":
      return {
        card: "bg-[#fff8d6]/76 border-black/18 shadow-[10px_10px_0_rgba(0,0,0,0.18)]",
        accent: "bg-[#ff4fd8]",
        title: "font-black uppercase tracking-[-0.04em]",
        italic: "",
      };
    case "retro-print":
      return {
        card: "bg-[#fff6ea]/74 border-[#8c4f33]/20 shadow-[0_18px_48px_rgba(108,63,39,0.12)]",
        accent: "bg-[#c96b3b]",
        title: "font-serif tracking-[-0.03em]",
        italic: "italic",
      };
    case "ember-glow":
      return {
        card: lightweight ? "bg-[#2a120d]/82 border-[#ff8a4c]/22 shadow-[0_14px_38px_rgba(255,102,51,0.14)]" : "bg-[#2a120d]/82 border-[#ff8a4c]/22 backdrop-blur-md shadow-[0_24px_90px_rgba(255,102,51,0.2)]",
        accent: "bg-[#ff8a4c]",
        title: "font-semibold tracking-[-0.05em]",
        italic: "",
      };
  }
}

function presetAccentColor(preset: TemplatePreset) {
  switch (preset) {
    case "white":
      return "#4b5563";
    case "black":
      return "#cbd5e1";
    case "premium":
      return "#b89d74";
    case "bold":
      return "#e7b84f";
    case "editorial":
      return "#826644";
    case "sunset":
      return "#dd7d31";
    case "mono":
      return "#cfcfcf";
    case "neon-grid":
      return "#27c9d4";
    case "paper-cut":
      return "#b9492b";
    case "arctic-glass":
      return "#1067d6";
    case "brutalist":
      return "#4a4a4a";
    case "velvet-noir":
      return "#d86492";
    case "mint-pop":
      return "#14a789";
    case "terminal":
      return "#24cc5b";
    case "blueprint":
      return "#5fb7e4";
    case "acid-pop":
      return "#d93fb8";
    case "retro-print":
      return "#aa5a31";
    case "ember-glow":
      return "#d97440";
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const safe =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHexColors(baseHex: string, mixHex: string, amount: number) {
  const normalize = (hex: string) => {
    const value = hex.replace("#", "");
    return value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  };

  const base = normalize(baseHex);
  const mix = normalize(mixHex);
  const ratio = clamp(amount);

  const baseValue = Number.parseInt(base, 16);
  const mixValue = Number.parseInt(mix, 16);

  const baseR = (baseValue >> 16) & 255;
  const baseG = (baseValue >> 8) & 255;
  const baseB = baseValue & 255;
  const mixR = (mixValue >> 16) & 255;
  const mixG = (mixValue >> 8) & 255;
  const mixB = mixValue & 255;

  const r = Math.round(baseR + (mixR - baseR) * ratio);
  const g = Math.round(baseG + (mixG - baseG) * ratio);
  const b = Math.round(baseB + (mixB - baseB) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

function getAnnouncementShuffledIndexMap(count: number) {
  const indices = Array.from({ length: count }, (_, index) => index);
  for (let index = 0; index < count; index += 1) {
    const swapIndex = (index * 7 + 3) % Math.max(1, count);
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }
  return indices;
}

function getStableVariantIndex(value: string, mod: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return mod > 0 ? hash % mod : 0;
}

function splitSloganText(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return { firstPart: "", secondPart: "" };
  const words = normalized.split(" ");
  if (words.length <= 3) return { firstPart: normalized, secondPart: "" };
  const splitIndex = Math.max(1, Math.ceil(words.length / 2));
  return {
    firstPart: words.slice(0, splitIndex).join(" "),
    secondPart: words.slice(splitIndex).join(" "),
  };
}

function splitTextIntoLines(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const words = normalized.split(" ");
  if (words.length <= 3) return [normalized];
  const splitIndex = Math.ceil(words.length / 2);
  return [words.slice(0, splitIndex).join(" "), words.slice(splitIndex).join(" ")].filter(Boolean);
}

function getAnnouncementScatterPosition(index: number, total: number, compact: boolean) {
  const longRowCount = compact ? 4 : 5;
  const shortRowCount = Math.max(1, longRowCount - 1);
  const pattern = [longRowCount, shortRowCount];
  const rows: number[] = [];
  let remaining = total;

  while (remaining > 0) {
    for (const size of pattern) {
      if (remaining <= 0) break;
      const nextRowSize = Math.min(size, remaining);
      rows.push(nextRowSize);
      remaining -= nextRowSize;
    }
  }

  let offset = 0;
  let row = 0;
  let column = 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const rowSize = rows[rowIndex];
    if (index < offset + rowSize) {
      row = rowIndex;
      column = index - offset;
      break;
    }
    offset += rowSize;
  }

  const horizontalPadding = compact ? -2 : -3;
  const verticalPadding = compact ? 1.5 : 1;
  const usableWidth = 100 - horizontalPadding * 2;
  const usableHeight = 100 - verticalPadding * 2;
  const rowHeight = usableHeight / Math.max(1, rows.length);
  const cellWidth = usableWidth / longRowCount;
  const rowSize = rows[row] ?? longRowCount;
  const rowOffset = rowSize === shortRowCount ? cellWidth * 0 : 0;
  const usedRowWidth = rowSize * cellWidth;
  const rowStart = horizontalPadding + (usableWidth - usedRowWidth) / 2 + rowOffset;
  const x = rowStart + column * cellWidth;
  const y = verticalPadding + row * rowHeight;

  return { x, y, cellWidth, rowHeight };
}

type LogoFrameMetrics = {
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
};

function getLogoFrameMetrics(naturalSize: { width: number; height: number } | null, compact: boolean): LogoFrameMetrics {
  const outerHeight = compact ? 152 : 208;
  const fallbackOuterWidth = compact ? 152 : 208;
  const fallbackInnerSize = compact ? 96 : 120;

  if (!naturalSize) {
    return {
      outerWidth: fallbackOuterWidth,
      outerHeight,
      innerWidth: fallbackInnerSize,
      innerHeight: fallbackInnerSize,
    };
  }

  const aspect = naturalSize.width / Math.max(1, naturalSize.height);
  const clampedAspect = clamp(aspect, 1, compact ? 2.0 : 2.15);
  const outerWidth = Math.round(outerHeight * clampedAspect);
  const isWide = clampedAspect > 1.18;
  const innerWidthScale = isWide ? (compact ? 0.76 : 0.78) : (compact ? 0.56 : 0.58);
  const innerHeightScale = isWide ? (compact ? 0.52 : 0.55) : innerWidthScale;

  return {
    outerWidth,
    outerHeight,
    innerWidth: Math.round(outerWidth * innerWidthScale),
    innerHeight: Math.round(outerHeight * innerHeightScale),
  };
}

function IntroLogo({
  scene,
  entryProgress,
  outroProgress = 0,
  compact,
  editable,
  onPickImage,
  lightweightPreview = false,
  textColor,
}: {
  scene: Scene;
  entryProgress: number;
  outroProgress?: number;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
  lightweightPreview?: boolean;
  textColor: string;
}) {
  const logoImageUrl = getRenderableImageUrl(scene.logoImageUrl);
  if (!logoImageUrl) return null;
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const metrics = getLogoFrameMetrics(naturalSize, compact);

  return (
    <div
      className="mx-auto mb-6 flex items-center justify-center"
      style={{
        transform: `translateY(${18 * (1 - entryProgress) - 28 * outroProgress}px) scale(${0.92 + entryProgress * 0.08 + outroProgress * 0.7})`,
        opacity: entryProgress,
      }}
    >
      <button
        type="button"
        onClick={editable ? onPickImage : undefined}
        className={`flex items-center justify-center rounded-[40px] overflow-hidden ${lightweightPreview ? "" : "backdrop-blur-sm"} ${editable ? "cursor-pointer transition hover:scale-105" : "cursor-default"}`}
        style={{
          width: `${metrics.outerWidth}px`,
          height: `${metrics.outerHeight}px`,
          padding: compact ? "16px" : "20px",
          color: textColor,
          border: `1px solid color-mix(in srgb, ${textColor} 20%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${textColor} 7%, transparent)`,
        }}
      >
        <AdaptiveLogoImage src={logoImageUrl} compact={compact} naturalSize={naturalSize} onLoadSizeChange={setNaturalSize} />
      </button>
    </div>
  );
}

function AdaptiveLogoImage({
  src,
  compact,
  naturalSize,
  onLoadSizeChange,
}: {
  src: string;
  compact: boolean;
  naturalSize: { width: number; height: number } | null;
  onLoadSizeChange: (value: { width: number; height: number }) => void;
}) {
  const metrics = getLogoFrameMetrics(naturalSize, compact);

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-[28px]"
      style={{
        width: `${metrics.innerWidth}px`,
        height: `${metrics.innerHeight}px`,
      }}
    >
      <img
        src={src}
        alt="Project logo"
        onLoad={(event) => {
          const image = event.currentTarget;
          onLoadSizeChange({ width: image.naturalWidth, height: image.naturalHeight });
        }}
        className="block h-full w-full object-contain"
        style={{
          borderRadius: compact ? "22px" : "26px",
        }}
      />
    </div>
  );
}

function IntroLogoSlot({
  scene,
  entryProgress,
  outroProgress = 0,
  compact,
  editable,
  onPickImage,
  lightweightPreview = false,
  textColor,
}: {
  scene: Scene;
  entryProgress: number;
  outroProgress?: number;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
  lightweightPreview?: boolean;
  textColor: string;
}) {
  if (getRenderableImageUrl(scene.logoImageUrl)) {
    return <IntroLogo scene={scene} entryProgress={entryProgress} outroProgress={outroProgress} compact={compact} editable={editable} onPickImage={onPickImage} lightweightPreview={lightweightPreview} textColor={textColor} />;
  }
  const placeholderMetrics = getLogoFrameMetrics(null, compact);

  return (
    <div
      className="mx-auto mb-6 flex items-center justify-center"
      style={{
        transform: `translateY(${18 * (1 - entryProgress) - 28 * outroProgress}px) scale(${0.92 + entryProgress * 0.08 + outroProgress * 0.7})`,
        opacity: entryProgress,
      }}
    >
      <button
        type="button"
        onClick={editable ? onPickImage : undefined}
        className={`flex items-center justify-center rounded-[40px] overflow-hidden ${lightweightPreview ? "" : "backdrop-blur-sm"} ${editable ? "cursor-pointer transition hover:scale-105" : "cursor-default"}`}
        style={{
          width: `${placeholderMetrics.outerWidth}px`,
          height: `${placeholderMetrics.outerHeight}px`,
          padding: compact ? "16px" : "20px",
          color: textColor,
          border: `1px solid color-mix(in srgb, ${textColor} 20%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${textColor} 7%, transparent)`,
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={`flex items-center justify-center rounded-[30px] border border-dashed ${compact ? "h-12 w-12 text-lg" : "h-20 w-20 text-3xl"}`}
            style={{ borderColor: `color-mix(in srgb, ${textColor} 35%, transparent)` }}
          >
            +
          </div>
          <span className={compact ? "text-[9px]" : "text-xs"}>Click to upload logo</span>
        </div>
      </button>
    </div>
  );
}

function QuoteAuthorPhoto({
  scene,
  entryProgress,
  compact,
  editable,
  onPickImage,
  textColor,
}: {
  scene: Scene;
  entryProgress: number;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
  textColor: string;
}) {
  const authorImageUrl = getRenderableImageUrl(scene.authorImageUrl);
  return (
    <div
      className="mb-5 flex justify-center"
      style={{
        transform: `translateY(${16 * (1 - entryProgress)}px) scale(${0.94 + entryProgress * 0.06})`,
        opacity: entryProgress,
      }}
    >
      {authorImageUrl ? (
        <button
          type="button"
          onClick={editable ? onPickImage : undefined}
          className={`${editable ? "cursor-pointer transition hover:scale-105" : "cursor-default"} rounded-full`}
          style={{ color: textColor }}
        >
          <img src={authorImageUrl} alt="Author photo or logo" className={compact ? "h-12 w-12 rounded-full object-cover ring-2 ring-white/15" : "h-20 w-20 rounded-full object-cover ring-4 ring-white/10"} />
        </button>
      ) : (
        <button
          type="button"
          onClick={editable ? onPickImage : undefined}
          className={`flex items-center justify-center rounded-full border border-dashed ${editable ? "cursor-pointer transition hover:scale-105" : "cursor-default"} ${compact ? "h-12 w-12 text-lg" : "h-20 w-20 text-3xl"}`}
          aria-label="Upload author photo or logo"
          style={{
            color: textColor,
            borderColor: `color-mix(in srgb, ${textColor} 35%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${textColor} 7%, transparent)`,
          }}
        >
          <span className="leading-none">+</span>
        </button>
      )}
    </div>
  );
}

function WebsiteScrollFrame({
  scene,
  cardClassName,
  style,
  compact,
  progress,
  editable,
  onPickImage,
  lightweightPreview = false,
  textColor,
}: {
  scene: Scene;
  cardClassName: string;
  style: CSSProperties;
  compact: boolean;
  progress: number;
  editable?: boolean;
  onPickImage?: () => void;
  lightweightPreview?: boolean;
  textColor: string;
}) {
  const scrollDelaySeconds = 1;
  const elapsedSceneSeconds = progress * scene.durationSeconds;
  const activeScrollSeconds = Math.max(0, elapsedSceneSeconds - scrollDelaySeconds);
  const scrollSpeedPerSecond = lightweightPreview ? 9 : 12;
  const scrollOffset = `${activeScrollSeconds * scrollSpeedPerSecond}%`;
  const websiteImageUrl = getRenderableImageUrl(scene.websiteImageUrl);
  const viewportHeight = compact ? 156 : 540;

  return (
    <div className={`w-full rounded-[28px] border p-5 ${cardClassName}`} style={style}>
      <div className="mb-3 flex gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
      </div>
      <button
        type="button"
        onClick={editable ? onPickImage : undefined}
        className={`relative block w-full overflow-hidden rounded-[22px] border text-left ${editable ? "cursor-pointer transition hover:scale-[1.01]" : "cursor-default"}`}
        style={{
          height: viewportHeight,
          borderColor: `color-mix(in srgb, ${textColor} 18%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${textColor} 8%, transparent)`,
          contain: "paint",
        }}
      >
        {websiteImageUrl ? (
          <img
            src={websiteImageUrl}
            alt="Website screenshot"
            className="absolute left-0 top-0 block w-full select-none"
            draggable={false}
            decoding="async"
            loading="eager"
            style={{
              transform: `translate3d(0, -${scrollOffset}, 0)`,
              transition: lightweightPreview ? "none" : "transform 80ms linear",
              willChange: lightweightPreview ? "auto" : "transform",
              backfaceVisibility: "hidden",
            }}
          />
        ) : (
          <div className="p-5">
            <div className="space-y-3">
              <div className="h-3 w-2/5 rounded-full bg-white/20" />
              <div className="h-28 rounded-[18px] bg-white/10" />
              <div className="h-3 rounded-full bg-white/16" />
              <div className="h-3 w-4/5 rounded-full bg-white/10" />
              <div
                className="flex h-20 items-center justify-center rounded-[18px] border border-dashed text-center text-xs"
                style={{
                  color: textColor,
                  borderColor: `color-mix(in srgb, ${textColor} 28%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${textColor} 6%, transparent)`,
                }}
              >
                {editable ? "Click to upload a tall website screenshot" : "Upload a tall website screenshot"}
              </div>
            </div>
          </div>
        )}
        {!lightweightPreview ? <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/25 to-transparent" /> : null}
        {!lightweightPreview ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" /> : null}
      </button>
    </div>
  );
}

function BulletMarker({ emoji, imageUrl, accentClassName, compact, interactive = false, onClick, animatedProgress }: { emoji?: string; imageUrl?: string; accentClassName: string; compact: boolean; interactive?: boolean; onClick?: () => void; animatedProgress?: number }) {
  const renderableImageUrl = getRenderableImageUrl(imageUrl);
  if (renderableImageUrl) {
    if (isAnimatedIconUrl(renderableImageUrl)) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`mb-3 overflow-hidden rounded-xl ${compact ? "h-10 w-10" : "h-16 w-16"} ${interactive ? "cursor-pointer transition hover:scale-105" : "cursor-default"}`}
        >
          <AnimatedIconPlayer src={renderableImageUrl} progress={animatedProgress} className="h-full w-full" />
        </button>
      );
    }

    return <img src={renderableImageUrl} alt="" onClick={onClick} className={`mb-3 rounded-xl object-cover ${compact ? "h-10 w-10" : "h-16 w-16"} ${interactive ? "cursor-pointer transition hover:scale-105" : ""}`} />;
  }

  if (emoji?.trim()) {
    return <div onClick={onClick} className={`mb-3 ${compact ? "text-lg" : "text-3xl"} ${interactive ? "cursor-pointer transition hover:scale-105" : ""}`}>{emoji.trim()}</div>;
  }

  return <div onClick={onClick} className={`mb-3 h-1.5 w-10 rounded-full ${accentClassName} ${interactive ? "cursor-pointer transition hover:scale-105" : ""}`} />;
}

function EditableCardItem({
  text,
  emoji,
  imageUrl,
  compact,
  textClassName,
  accentClassName,
  animatedProgress,
  onTextChange,
  onEmojiChange,
  onImageChange,
}: {
  text: string;
  emoji?: string;
  imageUrl?: string;
  compact: boolean;
  textClassName: string;
  accentClassName: string;
  animatedProgress?: number;
  onTextChange: (value: string) => void;
  onEmojiChange: (value: string) => void;
  onImageChange: (value: File | string | null) => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-4">
      {isPickerOpen ? (
        <EmojiAssetPicker
          onAnimatedSelect={(nextImageUrl, fallbackEmoji) => {
            onEmojiChange(fallbackEmoji);
            onImageChange(nextImageUrl);
            setIsPickerOpen(false);
          }}
          onClose={() => setIsPickerOpen(false)}
        />
      ) : null}
      <div className="shrink-0">
        <BulletMarker emoji={emoji} imageUrl={imageUrl} accentClassName={accentClassName} compact={compact} animatedProgress={animatedProgress} interactive onClick={() => setIsPickerOpen(true)} />
      </div>
      <input
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        className={`min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 outline-none focus:border-sky-400 ${textClassName}`}
        placeholder="Card text"
      />
    </div>
  );
}

function ShowcaseImageSlot({
  scene,
  compact,
  editable,
  onPickImage,
  onChangeMediaPosition,
  lightweightPreview = false,
  textColor,
}: {
  scene: Scene;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
  onChangeMediaPosition?: (value: "left" | "right" | "bottom") => void;
  lightweightPreview?: boolean;
  textColor: string;
}) {
  const websiteImageUrl = getRenderableImageUrl(scene.websiteImageUrl);
  const mediaButtons: Array<{ value: "left" | "right" | "bottom"; label: string }> = [
    { value: "left", label: "←" },
    { value: "right", label: "→" },
    { value: "bottom", label: "↓" },
  ];

  const mediaPositionControls =
    editable && onChangeMediaPosition ? (
      <>
        {mediaButtons.map((button) => {
          const active = scene.mediaPosition === button.value;
          const placementClassName =
            button.value === "left"
              ? "left-3 top-1/2 -translate-y-1/2"
              : button.value === "right"
                ? "right-3 top-1/2 -translate-y-1/2"
                : "bottom-3 left-1/2 -translate-x-1/2";

          return (
            <button
              key={button.value}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChangeMediaPosition(button.value);
              }}
              className={`absolute z-50 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition opacity-0 group-hover:opacity-100 ${lightweightPreview ? "" : "backdrop-blur-sm"} ${placementClassName} ${
                active
                  ? "border-sky-400 bg-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.35)]"
                  : "border-white/20 bg-black/45 text-white hover:bg-black/65"
              }`}
              style={active ? undefined : { color: textColor, borderColor: `color-mix(in srgb, ${textColor} 28%, transparent)`, backgroundColor: `color-mix(in srgb, ${textColor} 8%, transparent)` }}
              aria-label={`Move image ${button.value}`}
            >
              {button.label}
            </button>
          );
        })}
      </>
    ) : null;

  if (websiteImageUrl) {
    return (
      <div className="group relative">
        {mediaPositionControls}
        <button
          type="button"
          onClick={editable ? onPickImage : undefined}
          className={`block w-full ${editable ? "cursor-pointer transition hover:opacity-95" : "cursor-default"}`}
          style={{ color: textColor }}
        >
          <img
            src={websiteImageUrl}
            alt="Product screenshot"
            className="block h-full w-full object-cover object-top"
            style={{ height: compact ? 150 : 320 }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative">
      {mediaPositionControls}
      <button
        type="button"
        onClick={editable ? onPickImage : undefined}
        className={`flex w-full items-center justify-center ${editable ? "cursor-pointer transition" : "cursor-default"}`}
        style={{ height: compact ? 150 : 320, color: textColor }}
      >
        <div className="w-full px-6">
          <div
            className="mx-auto flex w-full max-w-[220px] flex-col items-center gap-4 rounded-[20px] border border-dashed px-6 py-8 text-center"
            style={{
              color: textColor,
              borderColor: `color-mix(in srgb, ${textColor} 28%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${textColor} 6%, transparent)`,
            }}
          >
            <div className="h-10 w-16 rounded-[14px] border" style={{ borderColor: `color-mix(in srgb, ${textColor} 24%, transparent)`, backgroundColor: `color-mix(in srgb, ${textColor} 10%, transparent)` }} />
            <div className="space-y-2">
              <div className="h-2 w-28 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${textColor} 22%, transparent)` }} />
              <div className="h-2 w-20 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${textColor} 12%, transparent)` }} />
            </div>
            <span className={compact ? "text-[9px]" : "text-xs"}>Click to upload screenshot</span>
          </div>
        </div>
      </button>
    </div>
  );
}

function EditableText({
  as,
  value,
  editable,
  multiline = false,
  className,
  style,
  placeholder,
  onCommit,
  unstyledWhenEditable = false,
}: {
  as: ElementType;
  value: string;
  editable: boolean;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  onCommit?: (value: string) => void;
  unstyledWhenEditable?: boolean;
}) {
  const Tag = as;

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!editable || !onCommit) return;
    onCommit(event.currentTarget.innerText.replace(/\n{3,}/g, "\n\n").trim());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!editable || multiline) return;
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <Tag
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className ?? ""} ${editable ? (unstyledWhenEditable ? "cursor-text outline-none" : "cursor-text rounded-xl outline-none focus:ring-2 focus:ring-sky-400/60") : ""}`}
      style={style}
      data-placeholder={placeholder}
    >
      {value || placeholder || ""}
    </Tag>
  );
}

function StageShell({
  backgroundColor,
  textColor,
  children,
  compact,
  renderLayer,
  lightweightPreview = false,
}: {
  backgroundColor: string;
  textColor: string;
  children: ReactNode;
  progress: number;
  compact: boolean;
  renderLayer: "full" | "background" | "content";
  lightweightPreview?: boolean;
}) {
  const showBackground = renderLayer !== "content";
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: showBackground ? backgroundColor : "transparent", color: textColor }}>
      {showBackground ? <div className="absolute inset-0" style={{ background: lightweightPreview ? "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 52%)" : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 28%, rgba(255,255,255,0) 65%), radial-gradient(circle at top, rgba(255,255,255,0.14), transparent 26%)", transform: "scale(1)" }} /> : null}
      {showBackground && !lightweightPreview ? <div className={`absolute left-[8%] top-[12%] rounded-full blur-3xl ${compact ? "h-20 w-20" : "h-36 w-36"}`} style={{ background: `${textColor}18`, transform: "translate3d(0, 0, 0)", opacity: 0.44 }} /> : null}
      {showBackground && !lightweightPreview ? <div className={`absolute right-[10%] top-[20%] rounded-full blur-3xl ${compact ? "h-24 w-24" : "h-48 w-48"}`} style={{ background: `${textColor}12`, transform: "translate3d(0, 0, 0)", opacity: 0.34 }} /> : null}
      {showBackground ? <div className={`absolute bottom-[12%] left-[14%] rotate-12 rounded-[28px] border border-white/10 ${compact ? "h-16 w-16" : "h-24 w-24"}`} style={{ opacity: 0.2, transform: "translate3d(0, 0, 0)" }} /> : null}
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

export function SceneStage({
  scene,
  backgroundColor,
  textColor,
  preset,
  performanceMode = "full",
  renderLayer = "full",
  progress = 1,
  compact = false,
  editable = false,
  onSceneChange,
  onRequestLogoUpload,
  onRequestHighlightUpload,
  onRequestAuthorUpload,
  uploadResolution = "540p",
  uploadProfile = "standard",
}: SceneStageProps) {
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [codeDraft, setCodeDraft] = useState(scene.code ?? scene.description);
  const lightweightPreview = performanceMode === "light";
  const optimizedLightRender = lightweightPreview && !editable;
  const blurMultiplier = optimizedLightRender ? 0.08 : lightweightPreview ? 0.2 : 1;
  const showSceneBackground = renderLayer !== "content";
  const showSceneContent = renderLayer !== "background";
  const sharedIn = editable ? 1 : motion(progress, 0.06, 0.24);
  const intro = sharedIn;
  const titleIn = sharedIn;
  const subIn = sharedIn;
  const cardIn = sharedIn;
  const outroFade = editable ? 1 : 1 - outroMotion(progress, 0.72, 0.28);
  const announcementLogoCount = scene.type === "announcement-hero" ? scene.projectCount ?? 8 : 0;
  const announcementLastTileDelay = announcementLogoCount > 0 ? 0.04 + Math.max(0, announcementLogoCount - 1) * 0.035 : 0.04;
  const announcementOutroDelay = Math.min(0.9, announcementLastTileDelay + 0.2);
  const announcementOutroFade = editable ? 1 : 1 - outroMotion(progress, announcementOutroDelay, 0.1);
  const isAnnouncementScene = scene.type === "announcement-hero" || scene.type === "split-slogan";
  const promoOutroProgress = editable || isAnnouncementScene ? 0 : outroMotion(progress, 0.78, 0.18);
  const sceneOutroFade = scene.type === "announcement-hero" ? announcementOutroFade : isAnnouncementScene ? outroFade : 1;
  const promoLayerOpacity = renderLayer === "background" ? 1 : 1 - promoOutroProgress;
  const s = presetStyles(preset, lightweightPreview);
  const accentColor = presetAccentColor(preset);
  const elevatedAccentColor = mixHexColors(accentColor, "#000000", preset === "black" ? 0.08 : 0.16);
  const accentGlow = hexToRgba(accentColor, optimizedLightRender ? 0.16 : 0.28);
  const urlTypingProgress = editable ? 1 : motion(progress, 0.08, 0.34);
  const urlCharacterCount = Math.max(1, Math.min(scene.title.length, Math.ceil((scene.title.length * urlTypingProgress) / 2) * 2));
  const displayedUrl = (editable ? scene.title : scene.title.slice(0, urlCharacterCount)).toLowerCase();
  const urlHover = editable ? 0 : motion(progress, 0.42, 0.1);
  const urlPress = editable ? 0 : motion(progress, 0.56, 0.08);
  const urlBurst = editable ? 0 : motion(progress, 0.62, 0.1);
  const urlFade = editable ? 0 : outroMotion(progress, 0.76, 0.18);
  const introLogoOutro = editable ? 0 : outroMotion(progress, 0.72, 0.2);
  const introTextOutro = editable ? 0 : outroMotion(progress, 0.58, 0.16);
  const ctaAppear = editable ? 1 : motion(progress, 0.18, 0.1);
  const ctaHover = editable ? 0 : motion(progress, 0.66, 0.1);
  const ctaPress = editable ? 0 : motion(progress, 0.76, 0.08);
  const ctaBurst = editable ? 0 : motion(progress, 0.8, 0.08);
  const ctaFade = editable ? 0 : outroMotion(progress, 0.88, 0.1);
  const titleSize = compact ? "text-lg" : "text-5xl";
  const midSize = compact ? "text-xs" : "text-lg";
  const smallSize = compact ? "text-[9px]" : "text-xs";
  const showcaseMediaFirst = scene.mediaPosition === "left";
  const showcaseImageBottom = scene.mediaPosition === "bottom";
  const introTitle = toSentenceCase(scene.title);
  const centerTextTitle = toSentenceCase(scene.title);
  const centerTextBoxIn = editable ? 1 : motion(progress, 0.06, 0.22);
  const sloganVariantIndex = scene.type === "split-slogan" ? getStableVariantIndex(scene.id || scene.name || scene.title, 8) : 0;
  const sloganPalette = [
    { background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 52%, #ec4899 100%)", text: "#f8fafc" },
    { background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 45%, #99f6e4 100%)", text: "#062a26" },
    { background: "linear-gradient(135deg, #f97316 0%, #fb7185 48%, #facc15 100%)", text: "#fff7ed" },
    { background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 46%, #67e8f9 100%)", text: "#ecfeff" },
    { background: "linear-gradient(135deg, #be123c 0%, #7c2d12 50%, #fb7185 100%)", text: "#fff1f2" },
    { background: "linear-gradient(135deg, #84cc16 0%, #22c55e 42%, #bef264 100%)", text: "#10230f" },
    { background: "linear-gradient(135deg, #111827 0%, #7c3aed 44%, #22d3ee 100%)", text: "#f9fafb" },
    { background: "linear-gradient(135deg, #fde047 0%, #fb7185 44%, #f97316 100%)", text: "#3b0a00" },
  ][sloganVariantIndex];
  const splitSloganSource = scene.type === "split-slogan" ? scene.title.toLowerCase() : scene.title;
  const { firstPart: sloganFirstPart, secondPart: sloganSecondPart } = splitSloganText(splitSloganSource);
  const sloganFirstLines = splitTextIntoLines(sloganSecondPart ? `${sloganFirstPart} ...` : sloganFirstPart);
  const sloganSecondLines = splitTextIntoLines(sloganSecondPart ? `... ${sloganSecondPart}` : "");
  const projectTitleEnter = editable ? 1 : motion(progress, 0.04, 0.08);
  const projectTitleExit = editable ? 0 : outroMotion(progress, 0.22, 0.08);
  const sloganFirstExit = editable ? 0 : outroMotion(progress, 0.54, 0.08);
  const sloganSecondExit = editable ? 0 : outroMotion(progress, 0.88, 0.08);

  const updateCenterTextTitle = (value: string) => {
    onSceneChange?.({ title: toSentenceCase(value) });
  };

  const updateIntroTitle = (value: string) => {
    onSceneChange?.({ title: toSentenceCase(value) });
  };

  useEffect(() => {
    if (!isCodeEditorOpen) {
      setCodeDraft(scene.code ?? scene.description);
    }
  }, [scene.code, scene.description, isCodeEditorOpen]);
  const shellOverlay =
    preset === "white"
      ? {
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0) 48%), radial-gradient(circle at 16% 18%, rgba(15,23,42,0.04), transparent 18%), radial-gradient(circle at 84% 22%, rgba(15,23,42,0.035), transparent 18%)",
        }
      : preset === "black"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 50%), radial-gradient(circle at 16% 18%, rgba(255,255,255,0.06), transparent 18%), radial-gradient(circle at 84% 22%, rgba(255,255,255,0.04), transparent 18%)",
          }
      : preset === "premium"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 48%), radial-gradient(circle at 20% 18%, rgba(215,185,138,0.16), transparent 20%), radial-gradient(circle at 82% 22%, rgba(215,185,138,0.09), transparent 18%)",
          }
      : preset === "bold"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 50%), linear-gradient(135deg, rgba(255,209,102,0.1) 0 18%, transparent 18% 100%), radial-gradient(circle at 88% 20%, rgba(255,209,102,0.14), transparent 20%)",
          }
      : preset === "editorial"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 50%), radial-gradient(circle at 18% 16%, rgba(154,123,79,0.12), transparent 18%), linear-gradient(90deg, rgba(24,20,17,0.05) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 100% 100%, 28px 28px",
          }
      : preset === "sunset"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,217,179,0.08), rgba(255,217,179,0) 48%), radial-gradient(circle at 18% 18%, rgba(251,146,60,0.22), transparent 18%), radial-gradient(circle at 82% 24%, rgba(255,112,67,0.18), transparent 22%)",
          }
      : preset === "mono"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 46%), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 32px 32px, 32px 32px",
          }
      : preset === "neon-grid"
      ? {
          background:
            "linear-gradient(180deg, rgba(8,19,33,0.18), rgba(8,19,33,0.02) 45%, rgba(8,19,33,0.22)), linear-gradient(rgba(57,243,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(57,243,255,0.08) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 44px 44px, 44px 44px",
        }
      : preset === "terminal"
        ? {
            background:
              "linear-gradient(180deg, rgba(7,19,12,0.14), rgba(7,19,12,0.02) 55%, rgba(45,255,114,0.06)), linear-gradient(rgba(125,255,155,0.07) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 100% 26px",
          }
      : preset === "blueprint"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 48%), linear-gradient(rgba(124,212,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(124,212,255,0.12) 1px, transparent 1px), radial-gradient(circle at 18% 20%, rgba(255,255,255,0.12), transparent 18%)",
            backgroundSize: "100% 100%, 28px 28px, 28px 28px, 100% 100%",
          }
      : preset === "acid-pop"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 42%), radial-gradient(circle at 16% 18%, rgba(255,79,216,0.28), transparent 16%), radial-gradient(circle at 84% 22%, rgba(42,16,255,0.18), transparent 18%), linear-gradient(135deg, rgba(0,0,0,0.08) 0 14%, transparent 14% 100%)",
          }
      : preset === "retro-print"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.04) 48%, rgba(255,255,255,0)), radial-gradient(circle at 18% 16%, rgba(201,107,59,0.16), transparent 18%), linear-gradient(90deg, rgba(62,36,24,0.06) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 100% 100%, 24px 24px",
          }
      : preset === "ember-glow"
        ? {
            background:
              "radial-gradient(circle at 20% 18%, rgba(255,138,76,0.22), transparent 20%), radial-gradient(circle at 82% 22%, rgba(255,217,191,0.12), transparent 18%), linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 46%), linear-gradient(135deg, rgba(255,90,31,0.08) 0 14%, transparent 14% 100%)",
          }
      : preset === "paper-cut"
        ? {
            background:
              "radial-gradient(circle at 12% 16%, rgba(217,87,52,0.14), transparent 18%), radial-gradient(circle at 86% 20%, rgba(255,196,90,0.18), transparent 16%), linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0))",
          }
        : preset === "velvet-noir"
          ? {
              background:
                "radial-gradient(circle at 18% 18%, rgba(255,119,170,0.18), transparent 18%), radial-gradient(circle at 82% 24%, rgba(129,79,255,0.16), transparent 20%), linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))",
            }
          : preset === "mint-pop"
            ? {
                background:
                  "radial-gradient(circle at 16% 18%, rgba(25,198,163,0.16), transparent 18%), radial-gradient(circle at 82% 22%, rgba(255,222,89,0.22), transparent 20%), linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0.04))",
              }
            : preset === "brutalist"
              ? {
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 40%), linear-gradient(135deg, rgba(0,0,0,0.08) 25%, transparent 25%), linear-gradient(315deg, rgba(0,0,0,0.05) 25%, transparent 25%)",
                  backgroundSize: "100% 100%, 36px 36px, 36px 36px",
                }
          : preset === "arctic-glass"
            ? {
                background:
                  "radial-gradient(circle at 20% 18%, rgba(255,255,255,0.8), transparent 18%), radial-gradient(circle at 80% 22%, rgba(124,220,255,0.34), transparent 20%), linear-gradient(180deg, rgba(255,255,255,0.42), rgba(223,245,255,0.05) 46%, rgba(20,121,255,0.06))",
              }
            : null;
  const shellDeco =
    preset === "white"
      ? "border-black/10"
      : preset === "black"
        ? "border-white/18"
      : preset === "premium"
        ? "border-[#d7b98a]/22"
      : preset === "bold"
        ? "border-[#ffd166]/24"
      : preset === "editorial"
        ? "border-[#9a7b4f]/22"
      : preset === "sunset"
        ? "border-[#fb923c]/24"
      : preset === "mono"
        ? "border-white/16"
      : preset === "neon-grid"
      ? "border-[#39f3ff]/22"
      : preset === "terminal"
        ? "border-[#2dff72]/24"
      : preset === "blueprint"
        ? "border-[#7cd4ff]/28"
      : preset === "acid-pop"
        ? "border-black/18"
      : preset === "retro-print"
        ? "border-[#c96b3b]/20"
      : preset === "ember-glow"
        ? "border-[#ff8a4c]/22"
      : preset === "paper-cut"
        ? "border-[#d95734]/16"
        : preset === "velvet-noir"
          ? "border-[#ff77aa]/20"
          : preset === "mint-pop"
            ? "border-[#19c6a3]/24"
            : preset === "brutalist"
              ? "border-black/20"
        : preset === "arctic-glass"
          ? "border-[#7cdcff]/30"
          : "border-white/10";
  const updateBullet = (index: number, value: string) => {
    const bullets = [...scene.bullets];
    bullets[index] = value;
    onSceneChange?.({ bullets });
  };
  const updateBulletEmoji = (index: number, value: string) => {
    const bulletEmojis = [...scene.bulletEmojis];
    const bulletImageUrls = [...scene.bulletImageUrls];
    bulletEmojis[index] = value;
    if (value.trim()) bulletImageUrls[index] = "";
    onSceneChange?.({ bulletEmojis, bulletImageUrls });
  };
  const updateBulletImage = async (index: number, value: File | string | null) => {
    const bulletImageUrls = [...scene.bulletImageUrls];
    if (typeof value === "string") bulletImageUrls[index] = value;
    else bulletImageUrls[index] = value ? await fileToStoredUrl(value, uploadResolution, uploadProfile) : "";
    onSceneChange?.({ bulletImageUrls });
  };

  return (
    <StageShell backgroundColor={backgroundColor} textColor={textColor} progress={progress} compact={compact} renderLayer={renderLayer} lightweightPreview={lightweightPreview}>
      {showSceneBackground && shellOverlay ? <div className="pointer-events-none absolute inset-0" style={shellOverlay} /> : null}
      {showSceneBackground ? (
        <>
          <div
            className={`pointer-events-none absolute right-[8%] top-[14%] rounded-[32px] border ${shellDeco} ${compact ? "h-16 w-16" : "h-28 w-28"}`}
            style={{
              transform:
                preset === "paper-cut" || preset === "brutalist" || preset === "acid-pop"
                  ? "rotate(-8deg)"
                  : preset === "terminal" || preset === "blueprint"
                    ? "rotate(0deg)"
                    : "rotate(14deg)",
              opacity: preset === "neon-grid" || preset === "terminal" || preset === "blueprint" ? 0.4 : preset === "white" ? 0.14 : 0.24,
            }}
          />
          <div
            className={`pointer-events-none absolute left-[10%] bottom-[14%] rounded-full border ${shellDeco} ${compact ? "h-14 w-14" : "h-24 w-24"}`}
            style={{ opacity: preset === "arctic-glass" || preset === "mint-pop" || preset === "ember-glow" ? 0.34 : preset === "mono" ? 0.12 : 0.2 }}
          />
        </>
      ) : null}
      <div className={scene.type === "announcement-hero" || scene.type === "split-slogan" ? "relative h-full w-full" : compact ? "relative h-full w-full px-4 py-4" : `relative h-full w-full px-8 ${scene.type === "product-showcase" && showcaseImageBottom ? "pt-8 pb-0" : "py-8"}`}>
      {showSceneContent ? (
        <div
          className="relative h-full w-full"
          style={{
            opacity: isAnnouncementScene ? sceneOutroFade : promoLayerOpacity,
            transform: isAnnouncementScene
              ? `translateY(${-10 * (1 - sceneOutroFade)}px)`
              : `translateY(${-28 * promoOutroProgress}px) scale(${1 - promoOutroProgress * 0.035})`,
            filter: isAnnouncementScene ? undefined : optimizedLightRender ? "none" : `blur(${8 * promoOutroProgress}px)`,
          }}
        >
      {scene.type === "announcement-hero" && (
        <div className="relative flex h-full items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, #4f6dff 0%, #9a68df 52%, #f05bb8 100%)",
              }}
            />
            <div className="absolute inset-0 bg-[#090d18]/42" />
            {Array.from({ length: scene.projectCount ?? 8 }, (_, index) => {
              const totalProjects = scene.projectCount ?? 8;
              const shuffledIndexMap = getAnnouncementShuffledIndexMap(totalProjects);
              const sourceIndex = shuffledIndexMap[index] ?? index;
              const imageUrl = getRenderableImageUrl(scene.projectImageUrls?.[sourceIndex]);
              const { x, y, cellWidth, rowHeight } = getAnnouncementScatterPosition(index, totalProjects, compact);
              const baseCardSize = Math.min(cellWidth, rowHeight) * (compact ? 0.62 : 0.58);
              const cardSize = index % 3 === 0 ? baseCardSize * 0.95 : index % 3 === 2 ? baseCardSize * 1.05 : baseCardSize;
              const tileIn = editable ? 1 : motion(progress, 0.04 + index * 0.035, 0.18);

              return (
                <div
                  key={`${scene.id}-announcement-project-${index}`}
                  className="absolute"
                  style={{
                    left: `${x + (cellWidth - cardSize) / 2}%`,
                    top: `${y + (rowHeight - cardSize) / 2}%`,
                    width: `${cardSize}%`,
                    aspectRatio: "1 / 1",
                    transform: `translateY(${18 * (1 - tileIn)}px) rotate(10deg) scale(${tileIn})`,
                    opacity: tileIn * 0.85,
                  }}
                >
                  <div
                    className={`h-full w-full overflow-hidden ${compact ? "rounded-[22px]" : "rounded-[24px]"} ${imageUrl ? "" : `border ${lightweightPreview ? "" : "backdrop-blur-sm"} ${compact ? "p-3" : "p-4"}`}`}
                    style={
                      imageUrl
                        ? undefined
                        : {
                            background: "rgba(15, 23, 42, 0.72)",
                            borderColor: "rgba(255,255,255,0.1)",
                            boxShadow: "0 18px 44px rgba(0,0,0,0.28)",
                          }
                    }
                  >
                    <div className={`flex h-full w-full items-center justify-center overflow-hidden ${imageUrl ? "" : "rounded-[18px] bg-white/6"}`}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={`Project logo ${sourceIndex + 1}`} className="h-full w-full rounded-[24px] object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-center text-[10px] uppercase tracking-[0.18em] text-white/35">
                          Project {index + 1}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.14)_0%,rgba(15,23,42,0.32)_100%)]" />
            <div className="absolute inset-0 bg-black/22" />
          </div>

          <div className="relative z-10 w-full max-w-5xl">
            <div
              className={`mx-auto ${compact ? "rounded-[30px] px-10 py-[3.25rem]" : "rounded-[38px] px-20 py-[5.5rem]"}`}
              style={{
                maxWidth: compact ? "47rem" : "58rem",
                background: "rgba(0, 0, 0, 0.87)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
                transform: `translateY(${-18 * (1 - announcementOutroFade)}px) scale(${1 + (1 - announcementOutroFade) * 0.04})`,
                opacity: announcementOutroFade,
              }}
            >
              <div className="text-center">
                <div
                  style={{
                    transform: `translateY(${-14 * (1 - announcementOutroFade)}px) scale(${1 + (1 - announcementOutroFade) * 0.02})`,
                    opacity: announcementOutroFade,
                  }}
                  className={compact ? "space-y-1" : "space-y-2"}
                >
                  <EditableText
                    as="div"
                    value={scene.eyebrow}
                    editable={editable}
                    onCommit={(value) => onSceneChange?.({ eyebrow: value })}
                    className={`${compact ? "text-5xl" : "text-[5.25rem]"} font-black leading-[1.04] tracking-[-0.035em] text-white`}
                    style={{ wordSpacing: "0.08em" }}
                    placeholder="This week on"
                  />
                  <div className="flex items-end justify-center gap-2">
                    <EditableText
                      as="div"
                      value={scene.title}
                      editable={editable}
                      onCommit={(value) => onSceneChange?.({ title: value })}
                      className={`${compact ? "text-5xl" : "text-[5.25rem]"} font-black leading-[1.04] tracking-[-0.035em] text-white`}
                      style={{ wordSpacing: "0.08em" }}
                      placeholder="DevHunt"
                    />
                    <span
                      aria-hidden="true"
                      className={`mb-[0.12em] inline-block ${compact ? "h-1.5 w-10" : "h-2 w-14"}`}
                      style={{ backgroundColor: "#ff5c00" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {scene.type === "brand-reveal" && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <IntroLogoSlot scene={scene} entryProgress={sharedIn} outroProgress={introLogoOutro} compact={compact} editable={editable} onPickImage={onRequestLogoUpload} lightweightPreview={lightweightPreview} textColor={textColor} />
          <EditableText
            as="h2"
            value={introTitle}
            editable={editable}
            onCommit={updateIntroTitle}
            className={`mt-4 leading-[0.95] ${compact ? "text-2xl" : "text-7xl"} ${s.title} normal-case`}
            style={{ transform: `translateY(${40 * (1 - titleIn) - 42 * introTextOutro}px) scale(${0.9 + titleIn * 0.1 + introTextOutro * 0.04})`, opacity: titleIn * (1 - Math.min(1, introTextOutro * 1.6)), filter: `blur(${16 * blurMultiplier * (1 - titleIn) + 18 * introTextOutro}px)` }}
            placeholder="Scene title"
          />
        </div>
      )}

      {scene.type === "product-showcase" && (
        showcaseImageBottom ? (
          <div className="relative flex h-full flex-col overflow-hidden">
            <div className="relative z-10 max-w-2xl text-left">
              <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} style={{ transform: `translateY(${-24 * (1 - titleIn)}px)`, opacity: titleIn }} placeholder="Title" />
              <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 max-w-xl ${midSize}`} style={revealStyle(subIn, { y: 26, blur: 12, minOpacity: 0 })} placeholder="Subtitle" />
            </div>
            <div
              className={`pointer-events-auto absolute left-1/2 top-[44%] w-[88%] -translate-x-1/2 rounded-[28px] border p-5 ${s.card}`}
              style={{ transform: `translate(-50%, ${34 * (1 - cardIn)}px) scale(${0.92 + cardIn * 0.08})`, opacity: cardIn }}
            >
              <div className="mb-3 flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white/60" /><span className="h-2.5 w-2.5 rounded-full bg-white/40" /><span className="h-2.5 w-2.5 rounded-full bg-white/25" /></div>
              <div className={`overflow-hidden rounded-[22px] border border-white/10 bg-black/10 ${compact ? "h-[170px]" : "h-[430px]"}`}>
                <ShowcaseImageSlot
                  scene={scene}
                  compact={compact}
                  editable={editable}
                  onPickImage={onRequestHighlightUpload}
                  onChangeMediaPosition={(value) => onSceneChange?.({ mediaPosition: value })}
                  lightweightPreview={lightweightPreview}
                  textColor={textColor}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid h-full items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div className={`text-left ${showcaseMediaFirst ? "md:order-2" : ""}`}>
              <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} style={{ transform: `translateY(${-24 * (1 - titleIn)}px)`, opacity: titleIn }} placeholder="Title" />
              <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 max-w-xl ${midSize}`} style={revealStyle(subIn, { y: 26, blur: 12, minOpacity: 0 })} placeholder="Subtitle" />
            </div>
            <div className={`w-full rounded-[28px] border p-5 ${s.card} ${showcaseMediaFirst ? "md:order-1" : ""}`} style={{ transform: `translateY(${34 * (1 - cardIn)}px) scale(${0.92 + cardIn * 0.08})`, opacity: cardIn }}>
              <div className="mb-3 flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white/60" /><span className="h-2.5 w-2.5 rounded-full bg-white/40" /><span className="h-2.5 w-2.5 rounded-full bg-white/25" /></div>
              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/10">
                <ShowcaseImageSlot
                  scene={scene}
                  compact={compact}
                  editable={editable}
                  onPickImage={onRequestHighlightUpload}
                  onChangeMediaPosition={(value) => onSceneChange?.({ mediaPosition: value })}
                  lightweightPreview={lightweightPreview}
                  textColor={textColor}
                />
              </div>
            </div>
          </div>
        )
      )}

      {scene.type === "feature-grid" && (
        <div className="flex h-full flex-col justify-center">
          <div className="text-center">
            <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${compact ? "text-2xl" : "text-6xl"} ${s.title}`} style={{ transform: `translateY(${20 * (1 - titleIn)}px)`, opacity: titleIn }} placeholder="Title" />
          </div>
          <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3">
            {scene.bullets.map((bullet, index) => {
              const itemIn = editable ? 1 : motion(progress, 0.1 + index * 0.05, 0.24);
              return (
                <div key={`${scene.id}-feature-${index}`} className={`rounded-[22px] border p-4 text-left ${s.card}`} style={{ transform: `translateY(${22 * (1 - itemIn)}px) scale(${0.92 + itemIn * 0.08})`, opacity: itemIn }}>
                  {editable ? (
                    <EditableCardItem
                      text={bullet}
                      emoji={scene.bulletEmojis[index]}
                      imageUrl={scene.bulletImageUrls[index]}
                      compact={compact}
                      textClassName={compact ? "text-base font-medium" : "text-xl font-semibold"}
                      animatedProgress={editable ? undefined : progress}
                      accentClassName={s.accent}
                      onTextChange={(value) => updateBullet(index, value)}
                      onEmojiChange={(value) => updateBulletEmoji(index, value)}
                      onImageChange={(file) => updateBulletImage(index, file)}
                    />
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="mb-0 shrink-0">
                        <BulletMarker emoji={scene.bulletEmojis[index]} imageUrl={scene.bulletImageUrls[index]} accentClassName={s.accent} compact={compact} animatedProgress={editable ? undefined : progress} />
                      </div>
                      <p className={compact ? "text-lg font-semibold leading-snug" : "text-3xl font-semibold leading-tight"} style={revealStyle(itemIn, { x: -8, y: 0, blur: 6, minOpacity: 0 })}>
                        {bullet}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

        {scene.type === "code-preview" && (
          <div className="flex h-full items-center justify-center px-4">
            <CodePreviewCard
              code={scene.code ?? scene.description}
              progress={editable ? 1 : progress}
              compact={compact}
              editable={editable}
              accentColor={elevatedAccentColor}
              onClick={editable ? () => setIsCodeEditorOpen(true) : undefined}
            />
          </div>
        )}

      {scene.type === "slogan" && (
        <div className="absolute inset-0 overflow-hidden text-center">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img
              src="/lottie/slogan.gif"
              alt=""
              className="slogan-gif-background"
              style={{ opacity: 1, transform: `scale(${1 + (1 - titleIn) * 0.02})` }}
            />
          </div>
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <EditableText
              as="h2"
              value={scene.title}
              editable={editable}
              onCommit={(value) => onSceneChange?.({ title: value })}
              className={`${compact ? "text-3xl" : "text-6xl md:text-7xl"} mx-auto max-w-4xl font-semibold leading-[0.92] tracking-[-0.06em] text-white`}
              style={{
                transform: `translateY(${42 * (1 - titleIn)}px) scale(${0.9 + titleIn * 0.1})`,
                opacity: titleIn,
              }}
              placeholder="Title"
            />
          </div>
        </div>
      )}

      {scene.type === "split-slogan" && (
        <div className="absolute inset-0 overflow-hidden text-center" style={{ background: sloganPalette.background }}>
          <div className="relative z-10 flex h-full items-center justify-center">
            <div className="mx-auto flex w-[80%] max-w-5xl flex-col items-center justify-center">
              <div className="relative min-h-[12rem] w-full">
                {scene.subtitle ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p
                      className={`${compact ? "text-6xl" : "text-8xl md:text-[6.25rem]"} w-full text-center font-black leading-[1.04] tracking-[0.01em]`}
                      style={{
                        color: sloganPalette.text,
                        transform: `translateY(${-24 * projectTitleExit}px) scale(${1 - projectTitleExit * 0.06})`,
                        opacity: projectTitleEnter * (1 - projectTitleExit),
                      }}
                    >
                      {scene.subtitle}
                    </p>
                  </div>
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="mx-auto flex w-[80%] max-w-5xl flex-col items-center justify-center text-center">
                    {sloganFirstLines.map((line, index) => {
                      const lineIn = editable ? 1 : motion(progress, 0.34 + index * 0.08, 0.08);
                      return (
                        <p
                          key={`split-slogan-first-${index}`}
                          className={`${compact ? "text-4xl" : "text-6xl md:text-7xl"} w-full text-center font-black leading-[1.08] tracking-[0.015em]`}
                          style={{
                            color: sloganPalette.text,
                            transform: `translateY(${18 * (1 - lineIn) - 20 * sloganFirstExit}px)`,
                            opacity: lineIn * (1 - sloganFirstExit),
                          }}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
                {sloganSecondPart ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="mx-auto flex w-[80%] max-w-5xl flex-col items-center justify-center text-center">
                      {sloganSecondLines.map((line, index) => {
                        const lineIn = editable ? 1 : motion(progress, 0.68 + index * 0.08, 0.08);
                        return (
                          <p
                            key={`split-slogan-second-${index}`}
                            className={`${compact ? "text-4xl" : "text-6xl md:text-7xl"} w-full text-center font-black leading-[1.08] tracking-[0.015em]`}
                            style={{
                              color: sloganPalette.text,
                              transform: `translateY(${18 * (1 - lineIn) - 20 * sloganSecondExit}px)`,
                              opacity: lineIn * (1 - sloganSecondExit),
                            }}
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {scene.type === "description" && (
        <div className={`relative flex h-full items-center overflow-hidden ${compact ? "-mx-4 -my-4" : "-mx-8 -my-8"}`}>
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <svg
              viewBox="0 0 1280 720"
              preserveAspectRatio="none"
              className="h-full w-full"
              style={{ opacity: editable ? 0.94 : 0.9 }}
            >
              <path
                d="M -280 140 C -60 -40, 120 60, 280 240 S 520 620, 700 560 S 960 220, 1140 320 S 1400 700, 1660 180"
                fill="none"
                stroke={elevatedAccentColor}
                strokeWidth={compact ? 18 : 26}
                strokeLinecap="round"
                style={{
                  filter: optimizedLightRender ? "none" : lightweightPreview ? "drop-shadow(0 0 8px rgba(0,0,0,0.08))" : `drop-shadow(0 0 18px ${accentGlow})`,
                  strokeDasharray: 2200,
                  strokeDashoffset: editable ? 0 : 2200 * (1 - motion(progress, 0.04, 0.66)),
                  transform: optimizedLightRender ? "translate(0px, 0px)" : `translate(${Math.sin((editable ? 0.7 : progress) * 4.6) * 8}px, ${Math.cos((editable ? 0.7 : progress) * 4.1) * 6}px)`,
                  transformOrigin: "center",
                }}
              />
            </svg>
          </div>
          <div className={`relative w-full text-left ${compact ? "px-4 py-4" : "px-8 py-8"}`}>
            <div className="relative">
              <EditableText
                as="h2"
                value={scene.title}
                editable={editable}
                onCommit={(value) => onSceneChange?.({ title: value })}
                className={`${compact ? "text-4xl" : "text-7xl md:text-8xl"} ${s.title} leading-[0.98] tracking-[-0.07em]`}
                style={revealStyle(editable ? 1 : motion(progress, 0.18, 0.14), { y: 20, blur: optimizedLightRender ? 0 : 8, minOpacity: 0 })}
                placeholder="Line 1"
              />
              <EditableText
                as="h2"
                value={scene.subtitle}
                editable={editable}
                onCommit={(value) => onSceneChange?.({ subtitle: value })}
                className={`mt-3 ${compact ? "text-4xl" : "text-7xl md:text-8xl"} ${s.title} leading-[0.98] tracking-[-0.07em]`}
                style={revealStyle(editable ? 1 : motion(progress, 0.38, 0.14), { y: 22, blur: optimizedLightRender ? 0 : 8, minOpacity: 0 })}
                placeholder="Line 2"
              />
              <EditableText
                as="h2"
                value={scene.description}
                editable={editable}
                onCommit={(value) => onSceneChange?.({ description: value })}
                className={`mt-3 ${compact ? "text-4xl" : "text-7xl md:text-8xl"} ${s.title} leading-[0.98] tracking-[-0.07em]`}
                style={revealStyle(editable ? 1 : motion(progress, 0.58, 0.14), { y: 24, blur: optimizedLightRender ? 0 : 8, minOpacity: 0 })}
                placeholder="Line 3"
              />
            </div>
          </div>
        </div>
      )}

      {scene.type === "pricing" && (
        <div className="flex h-full items-center justify-center px-6">
          <div className="w-full max-w-6xl">
            <div className="text-center">
              <EditableText
                as="h2"
                value={scene.title}
                editable={editable}
                onCommit={(value) => onSceneChange?.({ title: value })}
                className={`${compact ? "text-3xl" : "text-6xl md:text-7xl"} ${s.title} leading-[0.94] tracking-[-0.06em]`}
                style={revealStyle(editable ? 1 : motion(progress, 0.1, 0.14), { y: 18, blur: optimizedLightRender ? 0 : 8, minOpacity: 0 })}
                placeholder="Pricing"
              />
              <EditableText
                as="p"
                value={scene.subtitle}
                editable={editable}
                multiline
                onCommit={(value) => onSceneChange?.({ subtitle: value })}
                className={`mx-auto mt-4 max-w-3xl ${midSize} opacity-[0.82]`}
                style={revealStyle(editable ? 1 : motion(progress, 0.22, 0.14), { y: 16, blur: optimizedLightRender ? 0 : 8, minOpacity: 0 })}
                placeholder="Simple pricing"
              />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {scene.bullets.map((bullet, index) => {
                const itemIn = editable ? 1 : motion(progress, 0.2 + index * 0.08, 0.18);
                const featured = index === 1;
                const planTitles = scene.pricingPlanTitles ?? [];
                const planDescriptions = scene.pricingPlanDescriptions ?? [];
                const planTitle = planTitles[index] || (index === 0 ? "Starter" : index === 1 ? "Pro" : "Team");
                const planDescription =
                  planDescriptions[index] ||
                  (index === 0 ? "Great for small launches and demos." : index === 1 ? "Best balance of speed and polish." : "Everything a growing team needs.");
                return (
                  <div
                    key={`${scene.id}-pricing-${index}`}
                    className={`relative rounded-[30px] border p-6 ${featured ? "translate-y-[-8px]" : ""} ${s.card}`}
                    style={{ transform: `translateY(${18 * (1 - itemIn)}px) scale(${0.95 + itemIn * 0.05})`, opacity: itemIn }}
                  >
                    <EditableText
                      as="p"
                      value={planTitle}
                      editable={editable}
                      onCommit={(value) =>
                        onSceneChange?.({
                          pricingPlanTitles: planTitles.map((item, planIndex) => (planIndex === index ? value : item)),
                        })
                      }
                      className="text-xs uppercase tracking-[0.24em] opacity-55"
                      style={revealStyle(itemIn, { y: 8, blur: editable ? 0 : 4, minOpacity: 0 })}
                      placeholder={index === 0 ? "Starter" : index === 1 ? "Pro" : "Team"}
                    />
                    <EditableText
                      as="div"
                      value={bullet}
                      editable={editable}
                      onCommit={(value) => updateBullet(index, value)}
                      className={`mt-4 ${compact ? "text-2xl" : "text-5xl"} font-semibold leading-[0.92] tracking-[-0.07em] ${s.title}`}
                      style={revealStyle(itemIn, { y: 10, blur: editable ? 0 : 6, minOpacity: 0 })}
                      placeholder="Plan"
                    />
                    <div className="mt-4 h-1.5 w-20 rounded-full" style={{ backgroundColor: featured ? elevatedAccentColor : accentColor }} />
                    <EditableText
                      as="p"
                      value={planDescription}
                      editable={editable}
                      multiline
                      onCommit={(value) =>
                        onSceneChange?.({
                          pricingPlanDescriptions: planDescriptions.map((item, planIndex) => (planIndex === index ? value : item)),
                        })
                      }
                      className={`mt-4 ${compact ? "text-sm" : "text-lg"} leading-relaxed opacity-75`}
                      style={revealStyle(itemIn, { y: 8, blur: editable ? 0 : 4, minOpacity: 0 })}
                      placeholder={index === 0 ? "Great for small launches and demos." : index === 1 ? "Best balance of speed and polish." : "Everything a growing team needs."}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {scene.type === "center-text" && (
        <div className="relative flex h-full items-center justify-center overflow-hidden px-6">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "72px 72px",
                transform: `translate3d(${(motion(progress, 0.12, 0.18) - 0.5) * 18}px, ${(motion(progress, 0.28, 0.18) - 0.5) * 14}px, 0)`,
                opacity: 0.14,
              }}
            />
          </div>
          <div className="relative z-10 w-full max-w-4xl text-center">
            <div
              className={`relative mx-auto w-full rounded-[36px] border ${compact ? "px-8 py-8" : "px-12 py-10"}`}
              style={{
                maxWidth: compact ? "34rem" : "46rem",
                borderColor: `color-mix(in srgb, ${accentColor} 26%, transparent)`,
                background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 24%, transparent), color-mix(in srgb, ${elevatedAccentColor} 14%, transparent))`,
                boxShadow: `0 0 0 1px color-mix(in srgb, ${accentColor} 12%, transparent), 0 18px 60px rgba(0,0,0,0.18)`,
                backdropFilter: "blur(10px)",
                transform: `translate3d(0, ${(motion(progress, 0.22, 0.28) - 0.5) * 6}px, 0) scale(${0.96 + centerTextBoxIn * 0.04})`,
                opacity: 0.12 + centerTextBoxIn * 0.8,
              }}
            >
              <EditableText
                as="h2"
                value={centerTextTitle}
                editable={editable}
                onCommit={updateCenterTextTitle}
                className={`${compact ? "text-3xl" : "text-5xl md:text-7xl"} ${s.title} normal-case whitespace-normal break-normal leading-[0.98] tracking-[-0.055em]`}
                style={revealStyle(editable ? 1 : motion(progress, 0.12, 0.18), { y: 18, blur: optimizedLightRender ? 0 : 8, minOpacity: 0 })}
                placeholder="Bring the message to the center"
              />
            </div>
          </div>
        </div>
      )}

      {scene.type === "process" && (
        <div className="flex h-full items-center justify-center px-6">
          <div className="w-full max-w-6xl">
            <div className="text-center">
              <EditableText
                as="h2"
                value={scene.title}
                editable={editable}
                onCommit={(value) => onSceneChange?.({ title: value })}
                className={`${compact ? "text-3xl" : "text-6xl md:text-7xl"} ${s.title} leading-[0.94] tracking-[-0.06em]`}
                style={revealStyle(editable ? 1 : motion(progress, 0.1, 0.14), { y: 18, blur: optimizedLightRender ? 0 : 8, minOpacity: 0 })}
                placeholder="Process"
              />
              <EditableText
                as="p"
                value={scene.subtitle}
                editable={editable}
                multiline
                onCommit={(value) => onSceneChange?.({ subtitle: value })}
                className={`mx-auto mt-4 max-w-3xl ${midSize} opacity-[0.82]`}
                style={revealStyle(editable ? 1 : motion(progress, 0.22, 0.14), { y: 16, blur: optimizedLightRender ? 0 : 8, minOpacity: 0 })}
                placeholder="Three steps"
              />
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {scene.bullets.map((bullet, index) => {
                const itemIn = editable ? 1 : motion(progress, 0.18 + index * 0.08, 0.18);
                const stepDescriptions = scene.processStepDescriptions ?? [];
                const stepDescription =
                  stepDescriptions[index] ||
                  (index === 0 ? "Set the direction." : index === 1 ? "Build the core scene." : "Export and share.");
                return (
                  <div
                    key={`${scene.id}-process-${index}`}
                    className={`rounded-[26px] border p-5 ${s.card}`}
                    style={{ transform: `translateY(${18 * (1 - itemIn)}px) scale(${0.95 + itemIn * 0.05})`, opacity: itemIn }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold" style={{ borderColor: `color-mix(in srgb, ${textColor} 22%, transparent)`, color: textColor }}>
                        {index + 1}
                      </div>
                      <div className="h-1 flex-1 rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${100 - index * 14}%`, backgroundColor: index === 1 ? elevatedAccentColor : accentColor }} />
                      </div>
                    </div>
                    <EditableText
                      as="div"
                      value={bullet}
                      editable={editable}
                      onCommit={(value) => updateBullet(index, value)}
                      className={`mt-5 ${compact ? "text-xl" : "text-4xl"} font-semibold leading-[0.96] tracking-[-0.06em] ${s.title}`}
                      style={revealStyle(itemIn, { y: 10, blur: editable ? 0 : 6, minOpacity: 0 })}
                      placeholder="Step"
                    />
                    <EditableText
                      as="p"
                      value={stepDescription}
                      editable={editable}
                      multiline
                      onCommit={(value) =>
                        onSceneChange?.({
                          processStepDescriptions: stepDescriptions.map((item, stepIndex) => (stepIndex === index ? value : item)),
                        })
                      }
                      className={`mt-3 ${compact ? "text-sm" : "text-base"} leading-relaxed opacity-75`}
                      style={revealStyle(itemIn, { y: 8, blur: editable ? 0 : 4, minOpacity: 0 })}
                      placeholder={index === 0 ? "Set the direction." : index === 1 ? "Build the core scene." : "Export and share."}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {scene.type === "website-url" && (
        <div className={`flex h-full items-center justify-center overflow-hidden text-center ${compact ? "-mx-4 -my-4" : "-mx-8 -my-8"}`}>
          <div
            className="relative w-full"
            style={{
              transform: `scale(${1 + urlFade * (optimizedLightRender ? 0.08 : 0.12)})`,
              opacity: 1 - urlFade,
            }}
          >
            <div
              style={{
                transform: `translateY(${-42 * urlFade}px) scale(${1 + urlHover * (optimizedLightRender ? 0.012 : 0.02) - urlPress * (optimizedLightRender ? 0.035 : 0.06) + urlBurst * (optimizedLightRender ? 0.04 : 0.08) + urlFade * (optimizedLightRender ? 0.04 : 0.08)})`,
                opacity: 1 - urlFade,
              }}
            >
              <div
                className={`mx-auto flex items-center gap-4 rounded-full border ${compact ? "px-5 py-4" : "px-7 py-5"} ${s.card}`}
                style={{
                  width: compact ? "88%" : "82%",
                  maxWidth: compact ? "720px" : "980px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <span
                  aria-hidden="true"
                  className={`flex shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/8 ${compact ? "h-10 w-10" : "h-14 w-14"}`}
                >
                  <svg viewBox="0 0 24 24" className={compact ? "h-4 w-4" : "h-6 w-6"} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16l4.5 4.5" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <div className="inline-flex max-w-full items-end">
                    <EditableText
                      as="h2"
                      value={displayedUrl}
                      editable={editable}
                      onCommit={(value) => onSceneChange?.({ title: value.toLowerCase() })}
                      className={`${compact ? "text-xl" : "text-4xl md:text-5xl"} max-w-5xl font-medium leading-[0.92] tracking-[-0.05em] lowercase`}
                      style={{
                        opacity: 1 - urlFade,
                        filter: optimizedLightRender ? "none" : `brightness(${1 + urlPress * 0.12})`,
                      }}
                      placeholder="website.com"
                    />
                    {!editable ? (
                      <span
                        aria-hidden="true"
                        className="ml-1 shrink-0 rounded-full bg-current"
                        style={{
                          width: compact ? "2px" : "3px",
                          height: compact ? "28px" : "42px",
                          opacity: urlTypingProgress < 1 ? 0.9 : 0,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                {!editable ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute"
                      style={{
                        left: compact ? "50%" : "50%",
                        top: compact ? "61%" : "63%",
                        transform: `translate(-50%, -50%) translate(${(optimizedLightRender ? 120 : 180) * (1 - urlHover)}px, ${(optimizedLightRender ? 72 : 110) * (1 - urlHover) + 8 - urlPress * (optimizedLightRender ? 5 : 8)}px) scale(${1 - urlPress * (optimizedLightRender ? 0.04 : 0.08)}) rotate(-8deg)`,
                        opacity: optimizedLightRender ? (1 - urlFade) * (1 - Math.min(1, urlBurst * 1.8)) : (1 - urlFade) * (1 - Math.min(1, urlBurst * 1.35)),
                      }}
                    >
                    <svg
                      viewBox="0 0 64 72"
                      className={compact ? "h-10 w-8" : "h-16 w-12"}
                      fill="none"
                    >
                      <path
                        d="M10 7 V63 L31 38 H56 L10 7 Z"
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth="5.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                    {!optimizedLightRender ? (
                      <span
                        className="absolute left-[62%] top-[54%] rounded-full border"
                        style={{
                          width: `${10 + urlBurst * 20}px`,
                          height: `${10 + urlBurst * 20}px`,
                          transform: "translate(-50%, -50%)",
                          opacity: urlBurst > 0.06 ? (1 - urlBurst) * 0.55 : 0,
                          borderColor: hexToRgba(accentColor, 0.3 * (1 - urlBurst)),
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {scene.type === "website-scroll" && (
        <div className="flex h-full items-center justify-center">
            <WebsiteScrollFrame
              scene={scene}
              cardClassName={s.card}
              style={{ transform: `translateY(${24 * (1 - cardIn)}px) scale(${optimizedLightRender ? 0.97 + cardIn * 0.03 : 0.94 + cardIn * 0.06})`, opacity: cardIn }}
              compact={compact}
              progress={progress}
              editable={editable}
              onPickImage={onRequestHighlightUpload}
              lightweightPreview={lightweightPreview}
              textColor={textColor}
            />
        </div>
      )}

      {scene.type === "quote" && (
        <div className="flex h-full items-center justify-center text-center">
          <div className={`max-w-4xl rounded-[28px] border px-6 py-8 ${s.card}`} style={{ transform: `translateY(${24 * (1 - cardIn)}px) scale(${0.95 + cardIn * 0.05})`, opacity: cardIn }}>
            <QuoteAuthorPhoto scene={scene} entryProgress={editable ? 1 : motion(progress, 0.08, 0.14)} compact={compact} editable={editable} onPickImage={onRequestAuthorUpload} textColor={textColor} />
            <EditableText
              as="h2"
              value={scene.title}
              editable={editable}
              multiline
              onCommit={(value) => onSceneChange?.({ title: value })}
              className={`leading-tight ${compact ? "text-base" : "text-4xl"} ${s.title} ${s.italic}`}
              style={revealStyle(editable ? 1 : motion(progress, 0.22, 0.16), { y: 18, blur: 10, minOpacity: 0 })}
              placeholder="Quote"
            />
            {scene.subtitle || editable ? (
              <EditableText
                as="p"
                value={scene.subtitle}
                editable={editable}
                multiline
                onCommit={(value) => onSceneChange?.({ subtitle: value })}
                className={`mt-5 ${midSize} opacity-75`}
                style={revealStyle(editable ? 1 : motion(progress, 0.42, 0.16), { y: 14, blur: 8, minOpacity: 0 })}
                placeholder="Author"
              />
            ) : null}
          </div>
        </div>
      )}

      {scene.type === "cta" && (
        <div className="flex h-full items-center justify-center text-center">
          <div
            className="relative max-w-4xl"
            style={{
              transform: `scale(${1 + ctaFade * (optimizedLightRender ? 0.1 : 0.18)}) translateY(${-48 * ctaFade}px)`,
              opacity: 1 - ctaFade,
              filter: optimizedLightRender ? "none" : `blur(${14 * ctaFade}px)`,
            }}
          >
            <EditableText
              as="h2"
              value={scene.title}
              editable={editable}
              onCommit={(value) => onSceneChange?.({ title: value })}
              className={`mt-4 leading-tight ${titleSize} ${s.title}`}
              style={revealStyle(editable ? 1 : motion(progress, 0.08, 0.16), { y: 18, blur: 10, minOpacity: 0 })}
              placeholder="Title"
            />
            {scene.subtitle || editable ? (
              <EditableText
                as="p"
                value={scene.subtitle}
                editable={editable}
                multiline
                onCommit={(value) => onSceneChange?.({ subtitle: value })}
                className={`mx-auto mt-5 max-w-2xl ${midSize}`}
                style={revealStyle(editable ? 1 : motion(progress, 0.24, 0.16), { y: 16, blur: 10, minOpacity: 0 })}
                placeholder="Subtitle"
              />
            ) : null}
            <div className="relative mx-auto mt-8 inline-flex">
              <div
                className={`mx-auto inline-flex rounded-full border ${compact ? "px-8 py-4 text-sm" : "px-12 py-5 text-xl"} ${s.card}`}
                style={{
                  ...revealStyle(editable ? 1 : ctaAppear, { y: 14, blur: 8, minOpacity: 0 }),
                  transform: `translateY(${14 * (1 - ctaAppear)}px) scale(${1 + ctaHover * (optimizedLightRender ? 0.035 : 0.06) - ctaPress * (optimizedLightRender ? 0.1 : 0.18) + ctaBurst * (optimizedLightRender ? 0.12 : 0.24) + ctaFade * (optimizedLightRender ? 0.04 : 0.1)})`,
                  filter: optimizedLightRender ? "none" : `brightness(${1 + ctaHover * 0.1 + ctaPress * 0.38 + ctaBurst * 0.18})`,
                  backgroundColor: `rgba(255,255,255,${0.03 + ctaPress * 0.26 + ctaBurst * 0.14})`,
                  boxShadow: optimizedLightRender
                    ? "none"
                    : `0 0 0 ${6 + ctaPress * 18}px rgba(255,255,255,${0.05 + ctaPress * 0.12}), 0 12px 32px rgba(255,255,255,${0.04 + ctaBurst * 0.1})`,
                  pointerEvents: editable ? "auto" : progress >= 0.78 ? "auto" : "none",
                }}
              >
                Get started
              </div>
              {!editable && !optimizedLightRender ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: `${12 + ctaBurst * 128}px`,
                    height: `${12 + ctaBurst * 128}px`,
                    transform: "translate(-50%, -50%)",
                    opacity: ctaBurst > 0.02 ? (1 - ctaBurst) * 1 : 0,
                    background: "transparent",
                    boxShadow: `0 0 0 ${12 + ctaBurst * 36}px rgba(255,255,255,${0.18 * (1 - ctaBurst)})`,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
        </div>
      ) : null}
      </div>
      {scene.type === "code-preview" ? (
        <CodeEditorModal
          isOpen={isCodeEditorOpen && editable}
          title={scene.name}
          code={codeDraft}
          onChange={setCodeDraft}
          onClose={() => {
            setIsCodeEditorOpen(false);
            setCodeDraft(scene.code ?? scene.description);
          }}
          onApply={() => {
            onSceneChange?.({ code: codeDraft, description: codeDraft });
            setIsCodeEditorOpen(false);
          }}
        />
      ) : null}
    </StageShell>
  );
}
