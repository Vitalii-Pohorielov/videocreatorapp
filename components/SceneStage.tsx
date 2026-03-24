"use client";

import { useState, type CSSProperties, type ElementType, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

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

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value: number) {
  const t = clamp(value);
  return 1 - Math.pow(1 - t, 3);
}

function motion(progress: number, delay = 0, span = 1) {
  return easeOutCubic(clamp((progress - delay) / span));
}

function revealStyle(progress: number, options?: { y?: number; x?: number; scaleFrom?: number; blur?: number; minOpacity?: number }): CSSProperties {
  const y = options?.y ?? 18;
  const x = options?.x ?? 0;
  const scaleFrom = options?.scaleFrom ?? 0.98;
  const blur = options?.blur ?? 10;
  const minOpacity = options?.minOpacity ?? 0.14;

  return {
    transform: `translate(${x * (1 - progress)}px, ${y * (1 - progress)}px) scale(${scaleFrom + progress * (1 - scaleFrom)})`,
    opacity: minOpacity + progress * (1 - minOpacity),
    filter: `blur(${blur * (1 - progress)}px)`,
  };
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

function IntroLogo({
  scene,
  entryProgress,
  compact,
  editable,
  onPickImage,
  lightweightPreview = false,
}: {
  scene: Scene;
  entryProgress: number;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
  lightweightPreview?: boolean;
}) {
  const logoImageUrl = getRenderableImageUrl(scene.logoImageUrl);
  if (!logoImageUrl) return null;

  return (
    <div
      className="mx-auto mb-6 flex items-center justify-center"
      style={{
        transform: `translateY(${18 * (1 - entryProgress)}px) scale(${0.92 + entryProgress * 0.08})`,
        opacity: entryProgress,
      }}
    >
      <button
        type="button"
        onClick={editable ? onPickImage : undefined}
        className={`flex items-center justify-center rounded-[24px] border border-white/10 bg-white/8 px-6 py-4 ${lightweightPreview ? "" : "backdrop-blur-sm"} ${editable ? "cursor-pointer transition hover:scale-105 hover:bg-white/12" : "cursor-default"}`}
      >
        <img src={logoImageUrl} alt="Project logo" className={compact ? "max-h-12 max-w-[120px] object-contain" : "max-h-20 max-w-[220px] object-contain"} />
      </button>
    </div>
  );
}

function IntroLogoSlot({
  scene,
  entryProgress,
  compact,
  editable,
  onPickImage,
  lightweightPreview = false,
}: {
  scene: Scene;
  entryProgress: number;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
  lightweightPreview?: boolean;
}) {
  if (getRenderableImageUrl(scene.logoImageUrl)) {
    return <IntroLogo scene={scene} entryProgress={entryProgress} compact={compact} editable={editable} onPickImage={onPickImage} lightweightPreview={lightweightPreview} />;
  }

  return (
    <div
      className="mx-auto mb-6 flex items-center justify-center"
      style={{
        transform: `translateY(${18 * (1 - entryProgress)}px) scale(${0.92 + entryProgress * 0.08})`,
        opacity: entryProgress,
      }}
    >
      <button
        type="button"
        onClick={editable ? onPickImage : undefined}
        className={`flex items-center justify-center rounded-[24px] border border-white/10 bg-white/8 px-6 py-4 text-white/70 ${lightweightPreview ? "" : "backdrop-blur-sm"} ${editable ? "cursor-pointer transition hover:scale-105 hover:bg-white/12" : "cursor-default"}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`flex items-center justify-center rounded-[22px] border border-dashed border-white/20 ${compact ? "h-12 w-12 text-lg" : "h-20 w-20 text-3xl"}`}>
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
}: {
  scene: Scene;
  entryProgress: number;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
}) {
  const authorImageUrl = getRenderableImageUrl(scene.authorImageUrl);
  if (!authorImageUrl) return null;

  return (
    <div
      className="mb-5 flex justify-center"
      style={{
        transform: `translateY(${16 * (1 - entryProgress)}px) scale(${0.94 + entryProgress * 0.06})`,
        opacity: entryProgress,
      }}
    >
      <button
        type="button"
        onClick={editable ? onPickImage : undefined}
        className={`${editable ? "cursor-pointer transition hover:scale-105" : "cursor-default"} rounded-full`}
      >
        <img src={authorImageUrl} alt="Author portrait" className={compact ? "h-12 w-12 rounded-full object-cover ring-2 ring-white/15" : "h-20 w-20 rounded-full object-cover ring-4 ring-white/10"} />
      </button>
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
}: {
  scene: Scene;
  cardClassName: string;
  style: CSSProperties;
  compact: boolean;
  progress: number;
  editable?: boolean;
  onPickImage?: () => void;
  lightweightPreview?: boolean;
}) {
  const scrollDelaySeconds = 1;
  const elapsedSceneSeconds = progress * scene.durationSeconds;
  const activeScrollSeconds = Math.max(0, elapsedSceneSeconds - scrollDelaySeconds);
  const scrollSpeedPerSecond = 12;
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
        className={`relative block w-full overflow-hidden rounded-[22px] border border-white/10 bg-black/15 text-left ${editable ? "cursor-pointer transition hover:scale-[1.01]" : "cursor-default"}`}
        style={{ height: viewportHeight }}
      >
        {websiteImageUrl ? (
          <img
            src={websiteImageUrl}
            alt="Website screenshot"
            className="block w-full"
            style={{ transform: `translateY(-${scrollOffset}) translateZ(0)`, transition: lightweightPreview ? "none" : "transform 80ms linear", willChange: lightweightPreview ? "auto" : "transform" }}
          />
        ) : (
          <div className="p-5">
            <div className="space-y-3">
              <div className="h-3 w-2/5 rounded-full bg-white/20" />
              <div className="h-28 rounded-[18px] bg-white/10" />
              <div className="h-3 rounded-full bg-white/16" />
              <div className="h-3 w-4/5 rounded-full bg-white/10" />
              <div className={`flex h-20 items-center justify-center rounded-[18px] border border-dashed border-white/15 text-center text-xs text-white/65 ${editable ? "bg-white/5" : ""}`}>
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

function BulletMarker({ emoji, imageUrl, accentClassName, compact, interactive = false, onClick }: { emoji?: string; imageUrl?: string; accentClassName: string; compact: boolean; interactive?: boolean; onClick?: () => void }) {
  const renderableImageUrl = getRenderableImageUrl(imageUrl);
  if (renderableImageUrl) {
    return <img src={renderableImageUrl} alt="" onClick={onClick} className={`mb-3 rounded-xl object-cover ${compact ? "h-8 w-8" : "h-12 w-12"} ${interactive ? "cursor-pointer transition hover:scale-105" : ""}`} />;
  }

  if (emoji?.trim()) {
    return <div onClick={onClick} className={`mb-3 ${compact ? "text-base" : "text-2xl"} ${interactive ? "cursor-pointer transition hover:scale-105" : ""}`}>{emoji.trim()}</div>;
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
  onTextChange: (value: string) => void;
  onEmojiChange: (value: string) => void;
  onImageChange: (value: File | string | null) => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="relative">
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
      <BulletMarker emoji={emoji} imageUrl={imageUrl} accentClassName={accentClassName} compact={compact} interactive onClick={() => setIsPickerOpen(true)} />
      <input
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        className={`w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 outline-none focus:border-sky-400 ${textClassName}`}
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
}: {
  scene: Scene;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
  onChangeMediaPosition?: (value: "left" | "right" | "bottom") => void;
  lightweightPreview?: boolean;
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
              className={`absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition opacity-0 group-hover:opacity-100 ${lightweightPreview ? "" : "backdrop-blur-sm"} ${placementClassName} ${
                active
                  ? "border-sky-400 bg-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.35)]"
                  : "border-white/20 bg-black/45 text-white hover:bg-black/65"
              }`}
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
        <button type="button" onClick={editable ? onPickImage : undefined} className={`block w-full ${editable ? "cursor-pointer transition hover:opacity-95" : "cursor-default"}`}>
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
        className={`flex w-full items-center justify-center ${editable ? "cursor-pointer transition hover:bg-white/5" : "cursor-default"}`}
        style={{ height: compact ? 150 : 320 }}
      >
        <div className="w-full px-6">
          <div className="mx-auto flex w-full max-w-[220px] flex-col items-center gap-4 rounded-[20px] border border-dashed border-white/15 bg-white/5 px-6 py-8 text-center text-white/65">
            <div className="h-10 w-16 rounded-[14px] border border-white/15 bg-white/8" />
            <div className="space-y-2">
              <div className="h-2 w-28 rounded-full bg-white/20" />
              <div className="h-2 w-20 rounded-full bg-white/10" />
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
}: {
  as: ElementType;
  value: string;
  editable: boolean;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  onCommit?: (value: string) => void;
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
      className={`${className ?? ""} ${editable ? "cursor-text rounded-xl outline-none focus:ring-2 focus:ring-sky-400/60" : ""}`}
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
    <div className="relative h-full w-full overflow-hidden rounded-[24px]" style={{ backgroundColor: showBackground ? backgroundColor : "transparent", color: textColor }}>
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
  const lightweightPreview = performanceMode === "light";
  const blurMultiplier = lightweightPreview ? 0.35 : 1;
  const showSceneBackground = renderLayer !== "content";
  const showSceneContent = renderLayer !== "background";
  const sharedIn = editable ? 1 : motion(progress, 0.06, 0.24);
  const intro = sharedIn;
  const titleIn = sharedIn;
  const subIn = sharedIn;
  const cardIn = sharedIn;
  const outroFade = editable ? 1 : 1 - motion(progress, 0.72, 0.28);
  const s = presetStyles(preset, lightweightPreview);
  const titleSize = compact ? "text-lg" : "text-5xl";
  const midSize = compact ? "text-xs" : "text-lg";
  const smallSize = compact ? "text-[9px]" : "text-xs";
  const showcaseMediaFirst = scene.mediaPosition === "left";
  const showcaseImageBottom = scene.mediaPosition === "bottom";
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
      <div className={compact ? "relative h-full w-full px-4 py-4" : "relative h-full w-full px-8 py-8"}>
      {showSceneContent ? (
        <div
          className="relative h-full w-full"
          style={{
            opacity: outroFade,
            transform: `translateY(${-10 * (1 - outroFade)}px)`,
          }}
        >
      {scene.type === "brand-reveal" && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <IntroLogoSlot scene={scene} entryProgress={sharedIn} compact={compact} editable={editable} onPickImage={onRequestLogoUpload} lightweightPreview={lightweightPreview} />
          <EditableText
            as="h2"
            value={scene.title}
            editable={editable}
            onCommit={(value) => onSceneChange?.({ title: value })}
            className={`mt-4 leading-[0.95] ${compact ? "text-2xl" : "text-7xl"} ${s.title}`}
            style={{ transform: `translateY(${40 * (1 - titleIn)}px) scale(${0.9 + titleIn * 0.1})`, opacity: 0.2 + titleIn * 0.8, filter: `blur(${16 * blurMultiplier * (1 - titleIn)}px)` }}
            placeholder="Scene title"
          />
        </div>
      )}

      {scene.type === "product-showcase" && (
        showcaseImageBottom ? (
          <div className="relative flex h-full flex-col overflow-hidden">
            <div className="relative z-10 max-w-2xl text-left">
              <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.26em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
              <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} style={{ transform: `translateY(${-24 * (1 - titleIn)}px)`, opacity: 0.2 + titleIn * 0.8 }} placeholder="Title" />
              <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 max-w-xl ${midSize}`} style={revealStyle(subIn, { y: 26, blur: 12, minOpacity: 0.18 })} placeholder="Subtitle" />
            </div>
            <div
              className={`pointer-events-auto absolute left-1/2 top-[44%] w-[88%] -translate-x-1/2 rounded-[28px] border p-5 ${s.card}`}
              style={{ transform: `translate(-50%, ${34 * (1 - cardIn)}px) scale(${0.92 + cardIn * 0.08})`, opacity: 0.16 + cardIn * 0.84 }}
            >
              <div className="mb-3 flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white/60" /><span className="h-2.5 w-2.5 rounded-full bg-white/40" /><span className="h-2.5 w-2.5 rounded-full bg-white/25" /></div>
              <div className={`overflow-hidden rounded-[22px] border border-white/10 bg-black/10 ${compact ? "h-[170px]" : "h-[430px]"}`}>
                <div className={compact ? "translate-y-2" : "translate-y-8"}>
                  <ShowcaseImageSlot
                    scene={scene}
                    compact={compact}
                    editable={editable}
                    onPickImage={onRequestHighlightUpload}
                    onChangeMediaPosition={(value) => onSceneChange?.({ mediaPosition: value })}
                    lightweightPreview={lightweightPreview}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid h-full items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div className={`text-left ${showcaseMediaFirst ? "md:order-2" : ""}`}>
              <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.26em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
              <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} style={{ transform: `translateY(${-24 * (1 - titleIn)}px)`, opacity: 0.2 + titleIn * 0.8 }} placeholder="Title" />
              <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 max-w-xl ${midSize}`} style={revealStyle(subIn, { y: 26, blur: 12, minOpacity: 0.18 })} placeholder="Subtitle" />
            </div>
            <div className={`w-full rounded-[28px] border p-5 ${s.card} ${showcaseMediaFirst ? "md:order-1" : ""}`} style={{ transform: `translateY(${34 * (1 - cardIn)}px) scale(${0.92 + cardIn * 0.08})`, opacity: 0.16 + cardIn * 0.84 }}>
              <div className="mb-3 flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white/60" /><span className="h-2.5 w-2.5 rounded-full bg-white/40" /><span className="h-2.5 w-2.5 rounded-full bg-white/25" /></div>
              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/10">
                <ShowcaseImageSlot
                  scene={scene}
                  compact={compact}
                  editable={editable}
                  onPickImage={onRequestHighlightUpload}
                  onChangeMediaPosition={(value) => onSceneChange?.({ mediaPosition: value })}
                  lightweightPreview={lightweightPreview}
                />
              </div>
            </div>
          </div>
        )
      )}

      {scene.type === "feature-grid" && (
        <div className="flex h-full flex-col justify-center">
          <div className="text-center">
            <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.28em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
            <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} style={{ transform: `translateY(${20 * (1 - titleIn)}px)`, opacity: 0.2 + titleIn * 0.8 }} placeholder="Title" />
          </div>
          <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3">
            {scene.bullets.map((bullet, index) => {
              const itemIn = sharedIn;
              return (
                <div key={`${bullet}-${index}`} className={`rounded-[22px] border p-4 text-left ${s.card}`} style={{ transform: `translateY(${22 * (1 - itemIn)}px) scale(${0.92 + itemIn * 0.08})`, opacity: 0.12 + itemIn * 0.88 }}>
                  {editable ? (
                    <EditableCardItem
                      text={bullet}
                      emoji={scene.bulletEmojis[index]}
                      imageUrl={scene.bulletImageUrls[index]}
                      compact={compact}
                      textClassName={compact ? "text-[10px]" : "text-sm"}
                      accentClassName={s.accent}
                      onTextChange={(value) => updateBullet(index, value)}
                      onEmojiChange={(value) => updateBulletEmoji(index, value)}
                      onImageChange={(file) => updateBulletImage(index, file)}
                    />
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="mb-0 shrink-0">
                        <BulletMarker emoji={scene.bulletEmojis[index]} imageUrl={scene.bulletImageUrls[index]} accentClassName={s.accent} compact={compact} />
                      </div>
                      <p className={compact ? "text-sm font-medium" : "text-xl font-semibold leading-tight"} style={revealStyle(itemIn, { x: -8, y: 0, blur: 6, minOpacity: 0.22 })}>
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

      {scene.type === "slogan" && (
        <div className="flex h-full items-center justify-center text-center">
          <div className="max-w-4xl">
            <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.3em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
            <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title} ${s.italic}`} style={{ transform: `translateY(${54 * (1 - titleIn)}px) scale(${0.86 + titleIn * 0.14})`, opacity: 0.18 + titleIn * 0.82 }} placeholder="Title" />
            {scene.subtitle || editable ? <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 ${midSize}`} style={{ transform: `translateY(${24 * (1 - subIn)}px)`, opacity: 0.16 + subIn * 0.7 }} placeholder="Subtitle" /> : null}
          </div>
        </div>
      )}

      {scene.type === "description" && (
        <div className="grid h-full items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="text-left">
            <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.26em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
            <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} placeholder="Title" />
          </div>
          <div className={`rounded-[26px] border p-5 text-left ${s.card}`} style={{ transform: `translateY(${24 * (1 - cardIn)}px)`, opacity: 0.18 + cardIn * 0.82 }}>
            <EditableText as="p" value={scene.description || scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ description: value })} className={midSize} style={revealStyle(cardIn, { y: 18, blur: 10, minOpacity: 0.16 })} placeholder="Description" />
          </div>
        </div>
      )}

      {scene.type === "website-scroll" && (
        <div className="flex h-full items-center justify-center">
          <WebsiteScrollFrame
            scene={scene}
            cardClassName={s.card}
            style={{ transform: `translateY(${24 * (1 - cardIn)}px) scale(${0.94 + cardIn * 0.06})`, opacity: 0.16 + cardIn * 0.84 }}
            compact={compact}
            progress={progress}
            editable={editable}
            onPickImage={onRequestHighlightUpload}
            lightweightPreview={lightweightPreview}
          />
        </div>
      )}

      {scene.type === "metrics" && (
        <div className="flex h-full flex-col justify-center text-center">
          <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.28em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
          <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-3 leading-tight ${titleSize} ${s.title}`} placeholder="Title" />
          <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3">
            {scene.bullets.map((bullet, index) => {
              const itemIn = sharedIn;
              return (
                <div key={`${bullet}-${index}`} className={`rounded-[24px] border px-4 py-6 ${s.card}`} style={{ transform: `translateY(${24 * (1 - itemIn)}px)`, opacity: 0.12 + itemIn * 0.88 }}>
                  {editable ? (
                    <EditableCardItem
                      text={bullet}
                      emoji={scene.bulletEmojis[index]}
                      imageUrl={scene.bulletImageUrls[index]}
                      compact={compact}
                      textClassName={compact ? "text-[10px]" : "text-base font-medium"}
                      accentClassName={s.accent}
                      onTextChange={(value) => updateBullet(index, value)}
                      onEmojiChange={(value) => updateBulletEmoji(index, value)}
                      onImageChange={(file) => updateBulletImage(index, file)}
                    />
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <BulletMarker emoji={scene.bulletEmojis[index]} imageUrl={scene.bulletImageUrls[index]} accentClassName={s.accent} compact={compact} />
                      </div>
                      <p className={compact ? "text-[10px]" : "text-base font-medium"} style={revealStyle(itemIn, { y: 10, blur: 6, minOpacity: 0.24 })}>{bullet}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scene.type === "quote" && (
        <div className="flex h-full items-center justify-center text-center">
          <div className={`max-w-4xl rounded-[28px] border px-6 py-8 ${s.card}`} style={{ transform: `translateY(${24 * (1 - cardIn)}px) scale(${0.95 + cardIn * 0.05})`, opacity: 0.16 + cardIn * 0.84 }}>
            <QuoteAuthorPhoto scene={scene} entryProgress={sharedIn} compact={compact} editable={editable} onPickImage={onRequestAuthorUpload} />
            <div className="mb-4 text-4xl opacity-50">"</div>
            <EditableText as="h2" value={scene.title} editable={editable} multiline onCommit={(value) => onSceneChange?.({ title: value })} className={`leading-tight ${compact ? "text-base" : "text-4xl"} ${s.title} ${s.italic}`} placeholder="Quote" />
            {scene.subtitle || editable ? <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 ${midSize} opacity-75`} style={revealStyle(subIn, { y: 14, blur: 8, minOpacity: 0.18 })} placeholder="Author" /> : null}
          </div>
        </div>
      )}

      {scene.type === "checklist" && (
        <div className="flex h-full flex-col justify-center">
          <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`text-center uppercase tracking-[0.28em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
          <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 text-center leading-tight ${titleSize} ${s.title}`} placeholder="Title" />
          <div className="mx-auto mt-8 grid max-w-3xl gap-3">
            {scene.bullets.map((bullet, index) => {
              const itemIn = sharedIn;
              return <div key={`${bullet}-${index}`} className={`flex items-center gap-3 rounded-[22px] border px-4 py-4 ${s.card}`} style={{ transform: `translateX(${-24 * (1 - itemIn)}px)`, opacity: 0.14 + itemIn * 0.86 }}><div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">{index + 1}</div><p className={compact ? "text-[10px]" : "text-sm"} style={revealStyle(itemIn, { x: -10, y: 0, blur: 6, minOpacity: 0.22 })}>{bullet}</p></div>;
            })}
          </div>
        </div>
      )}

      {scene.type === "cta" && (
        <div className="flex h-full items-center justify-center text-center">
          <div className="max-w-4xl">
            <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.3em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
            <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} placeholder="Title" />
            {scene.subtitle || editable ? <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mx-auto mt-5 max-w-2xl ${midSize}`} style={revealStyle(subIn, { y: 16, blur: 10, minOpacity: 0.18 })} placeholder="Subtitle" /> : null}
            <div className={`mx-auto mt-8 inline-flex rounded-full border px-6 py-3 ${s.card}`} style={revealStyle(cardIn, { y: 14, blur: 8, minOpacity: 0.16 })}>Get started</div>
          </div>
        </div>
      )}
        </div>
      ) : null}
      </div>
    </StageShell>
  );
}
