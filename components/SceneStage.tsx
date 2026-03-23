"use client";

import { useState, type CSSProperties, type ElementType, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

import { EmojiAssetPicker } from "@/components/EmojiAssetPicker";
import { fileToOptimizedDataUrl } from "@/lib/imageUpload";
import type { ExportProfile, ExportResolution, Scene, TemplatePreset } from "@/store/useStore";

type SceneStageProps = {
  scene: Scene;
  backgroundColor: string;
  textColor: string;
  preset: TemplatePreset;
  progress?: number;
  compact?: boolean;
  editable?: boolean;
  onSceneChange?: (updates: Partial<Omit<Scene, "id" | "type">>) => void;
  onRequestLogoUpload?: () => void;
  onRequestHighlightUpload?: () => void;
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

function presetStyles(preset: TemplatePreset) {
  switch (preset) {
    case "clean":
      return {
        card: "bg-white/70 border-black/8 backdrop-blur-sm shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
        accent: "bg-black/75",
        title: "font-semibold tracking-[-0.03em]",
        italic: "",
      };
    case "premium":
      return {
        card: "bg-white/8 border-[#d7b98a]/35 backdrop-blur-md shadow-[0_24px_70px_rgba(5,10,20,0.35)]",
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
        card: "bg-white/55 border-black/10 backdrop-blur-sm shadow-[0_22px_55px_rgba(60,35,15,0.1)]",
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
        card: "bg-[#08192d]/72 border-[#39f3ff]/28 backdrop-blur-md shadow-[0_0_0_1px_rgba(57,243,255,0.08),0_28px_80px_rgba(0,0,0,0.45)]",
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
        card: "bg-white/28 border-[#7cdcff]/34 backdrop-blur-xl shadow-[0_20px_70px_rgba(83,150,200,0.16)]",
        accent: "bg-[#1479ff]",
        title: "font-semibold tracking-[-0.05em]",
        italic: "",
      };
  }
}

function IntroLogo({ scene, progress, compact }: { scene: Scene; progress: number; compact: boolean }) {
  const logoImageUrl = getRenderableImageUrl(scene.logoImageUrl);
  if (!logoImageUrl) return null;

  const logoIn = motion(progress, 0, 0.24);

  return (
    <div
      className="mx-auto mb-6 flex items-center justify-center"
      style={{
        transform: `translateY(${18 * (1 - logoIn)}px) scale(${0.92 + logoIn * 0.08})`,
        opacity: 0.18 + logoIn * 0.82,
      }}
    >
      <div className="flex items-center justify-center rounded-[24px] border border-white/10 bg-white/8 px-6 py-4 backdrop-blur-sm">
        <img src={logoImageUrl} alt="Project logo" className={compact ? "max-h-12 max-w-[120px] object-contain" : "max-h-20 max-w-[220px] object-contain"} />
      </div>
    </div>
  );
}

function IntroLogoSlot({
  scene,
  progress,
  compact,
  editable,
  onPickImage,
}: {
  scene: Scene;
  progress: number;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
}) {
  if (getRenderableImageUrl(scene.logoImageUrl)) {
    return <IntroLogo scene={scene} progress={progress} compact={compact} />;
  }

  const logoIn = motion(progress, 0, 0.24);

  return (
    <div
      className="mx-auto mb-6 flex items-center justify-center"
      style={{
        transform: `translateY(${18 * (1 - logoIn)}px) scale(${0.92 + logoIn * 0.08})`,
        opacity: 0.18 + logoIn * 0.82,
      }}
    >
      <button
        type="button"
        onClick={editable ? onPickImage : undefined}
        className={`flex items-center justify-center rounded-[24px] border border-white/10 bg-white/8 px-6 py-4 text-white/70 backdrop-blur-sm ${editable ? "cursor-pointer transition hover:scale-105 hover:bg-white/12" : "cursor-default"}`}
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

function QuoteAuthorPhoto({ scene, progress, compact }: { scene: Scene; progress: number; compact: boolean }) {
  const authorImageUrl = getRenderableImageUrl(scene.authorImageUrl);
  if (!authorImageUrl) return null;

  const photoIn = motion(progress, 0.08, 0.24);

  return (
    <div
      className="mb-5 flex justify-center"
      style={{
        transform: `translateY(${16 * (1 - photoIn)}px) scale(${0.94 + photoIn * 0.06})`,
        opacity: 0.2 + photoIn * 0.8,
      }}
    >
      <img src={authorImageUrl} alt="Author portrait" className={compact ? "h-12 w-12 rounded-full object-cover ring-2 ring-white/15" : "h-20 w-20 rounded-full object-cover ring-4 ring-white/10"} />
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
}: {
  scene: Scene;
  cardClassName: string;
  style: CSSProperties;
  compact: boolean;
  progress: number;
  editable?: boolean;
  onPickImage?: () => void;
}) {
  const scrollOffset = `${progress * 45}%`;
  const websiteImageUrl = getRenderableImageUrl(scene.websiteImageUrl);

  return (
    <div className={`w-full rounded-[28px] border p-5 ${cardClassName}`} style={style}>
      <div className="mb-3 flex gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
      </div>
      <button
        type="button"
        onClick={!websiteImageUrl && editable ? onPickImage : undefined}
        className={`relative block w-full overflow-hidden rounded-[22px] border border-white/10 bg-black/15 text-left ${!websiteImageUrl && editable ? "cursor-pointer transition hover:scale-[1.01]" : "cursor-default"}`}
        style={{ height: compact ? 132 : 420 }}
      >
        {websiteImageUrl ? (
          <img
            src={websiteImageUrl}
            alt="Website screenshot"
            className="block w-full"
            style={{ transform: `translateY(-${scrollOffset})`, transition: "transform 120ms linear" }}
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
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
}: {
  scene: Scene;
  compact: boolean;
  editable: boolean;
  onPickImage?: () => void;
}) {
  const websiteImageUrl = getRenderableImageUrl(scene.websiteImageUrl);
  if (websiteImageUrl) {
    return (
      <img
        src={websiteImageUrl}
        alt="Product screenshot"
        className="block h-full w-full object-cover object-top"
        style={{ height: compact ? 150 : 320 }}
      />
    );
  }

  return (
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

function StageShell({ backgroundColor, textColor, children, progress, compact }: { backgroundColor: string; textColor: string; children: ReactNode; progress: number; compact: boolean }) {
  const bg = motion(progress, 0, 1);
  const drift = 34 * (1 - bg);
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-[24px] ${compact ? "px-4 py-4" : "px-8 py-8"}`} style={{ backgroundColor, color: textColor }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 28%, rgba(255,255,255,0) 65%), radial-gradient(circle at top, rgba(255,255,255,0.14), transparent 26%)", transform: `scale(${1.06 - bg * 0.06})` }} />
      <div className={`absolute left-[8%] top-[12%] rounded-full blur-3xl ${compact ? "h-20 w-20" : "h-36 w-36"}`} style={{ background: `${textColor}18`, transform: `translate3d(${-drift}px, ${drift * 0.4}px, 0)`, opacity: 0.18 + bg * 0.26 }} />
      <div className={`absolute right-[10%] top-[20%] rounded-full blur-3xl ${compact ? "h-24 w-24" : "h-48 w-48"}`} style={{ background: `${textColor}12`, transform: `translate3d(${drift}px, ${-drift * 0.3}px, 0)`, opacity: 0.14 + bg * 0.2 }} />
      <div className={`absolute bottom-[12%] left-[14%] rotate-12 rounded-[28px] border border-white/10 ${compact ? "h-16 w-16" : "h-24 w-24"}`} style={{ opacity: 0.08 + bg * 0.12, transform: `translate3d(${drift * 0.2}px, ${-drift * 0.1}px, 0)` }} />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

export function SceneStage({
  scene,
  backgroundColor,
  textColor,
  preset,
  progress = 1,
  compact = false,
  editable = false,
  onSceneChange,
  onRequestLogoUpload,
  onRequestHighlightUpload,
  uploadResolution = "540p",
  uploadProfile = "standard",
}: SceneStageProps) {
  const intro = motion(progress, 0.02, 0.34);
  const titleIn = motion(progress, 0.04, 0.28);
  const subIn = motion(progress, 0.08, 0.26);
  const cardIn = motion(progress, 0.1, 0.3);
  const s = presetStyles(preset);
  const titleSize = compact ? "text-lg" : "text-5xl";
  const midSize = compact ? "text-xs" : "text-lg";
  const smallSize = compact ? "text-[9px]" : "text-xs";
  const showcaseMediaFirst = scene.mediaPosition === "left";
  const shellOverlay =
    preset === "neon-grid"
      ? {
          background:
            "linear-gradient(180deg, rgba(8,19,33,0.18), rgba(8,19,33,0.02) 45%, rgba(8,19,33,0.22)), linear-gradient(rgba(57,243,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(57,243,255,0.08) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 44px 44px, 44px 44px",
        }
      : preset === "paper-cut"
        ? {
            background:
              "radial-gradient(circle at 12% 16%, rgba(217,87,52,0.14), transparent 18%), radial-gradient(circle at 86% 20%, rgba(255,196,90,0.18), transparent 16%), linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0))",
          }
        : preset === "arctic-glass"
          ? {
              background:
                "radial-gradient(circle at 20% 18%, rgba(255,255,255,0.8), transparent 18%), radial-gradient(circle at 80% 22%, rgba(124,220,255,0.34), transparent 20%), linear-gradient(180deg, rgba(255,255,255,0.42), rgba(223,245,255,0.05) 46%, rgba(20,121,255,0.06))",
            }
          : null;
  const shellDeco =
    preset === "neon-grid"
      ? "border-[#39f3ff]/22"
      : preset === "paper-cut"
        ? "border-[#d95734]/16"
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
    else bulletImageUrls[index] = value ? await fileToOptimizedDataUrl(value, uploadResolution, uploadProfile) : "";
    onSceneChange?.({ bulletImageUrls });
  };

  return (
    <StageShell backgroundColor={backgroundColor} textColor={textColor} progress={progress} compact={compact}>
      {shellOverlay ? <div className="pointer-events-none absolute inset-0" style={shellOverlay} /> : null}
      {(preset === "paper-cut" || preset === "arctic-glass" || preset === "neon-grid") ? (
        <>
          <div className={`pointer-events-none absolute right-[8%] top-[14%] rounded-[32px] border ${shellDeco} ${compact ? "h-16 w-16" : "h-28 w-28"}`} style={{ transform: preset === "paper-cut" ? "rotate(-8deg)" : "rotate(14deg)", opacity: preset === "neon-grid" ? 0.4 : 0.22 }} />
          <div className={`pointer-events-none absolute left-[10%] bottom-[14%] rounded-full border ${shellDeco} ${compact ? "h-14 w-14" : "h-24 w-24"}`} style={{ opacity: preset === "arctic-glass" ? 0.34 : 0.18 }} />
        </>
      ) : null}
      {scene.type === "brand-reveal" && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <IntroLogoSlot scene={scene} progress={progress} compact={compact} editable={editable} onPickImage={onRequestLogoUpload} />
          <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.3em] opacity-70 ${smallSize}`} style={{ transform: `translateY(${18 * (1 - intro)}px)`, opacity: 0.2 + intro * 0.7 }} placeholder="Eyebrow" />
          <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} style={{ transform: `translateY(${40 * (1 - titleIn)}px) scale(${0.9 + titleIn * 0.1})`, opacity: 0.2 + titleIn * 0.8, filter: `blur(${16 * (1 - titleIn)}px)` }} placeholder="Scene title" />
          {scene.subtitle || editable ? <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 max-w-2xl ${midSize}`} style={{ transform: `translateY(${24 * (1 - subIn)}px)`, opacity: 0.18 + subIn * 0.72 }} placeholder="Subtitle" /> : null}
        </div>
      )}

      {scene.type === "product-showcase" && (
        <div className="grid h-full items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className={`text-left ${showcaseMediaFirst ? "md:order-2" : ""}`}>
            <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.26em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
            <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} style={{ transform: `translateY(${-24 * (1 - titleIn)}px)`, opacity: 0.2 + titleIn * 0.8 }} placeholder="Title" />
            <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 max-w-xl ${midSize}`} style={{ transform: `translateY(${26 * (1 - subIn)}px)`, opacity: 0.2 + subIn * 0.68 }} placeholder="Subtitle" />
          </div>
          <div className={`w-full rounded-[28px] border p-5 ${s.card} ${showcaseMediaFirst ? "md:order-1" : ""}`} style={{ transform: `translateY(${34 * (1 - cardIn)}px) scale(${0.92 + cardIn * 0.08})`, opacity: 0.16 + cardIn * 0.84 }}>
            <div className="mb-3 flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white/60" /><span className="h-2.5 w-2.5 rounded-full bg-white/40" /><span className="h-2.5 w-2.5 rounded-full bg-white/25" /></div>
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/10">
              <ShowcaseImageSlot scene={scene} compact={compact} editable={editable} onPickImage={onRequestHighlightUpload} />
            </div>
          </div>
        </div>
      )}

      {scene.type === "feature-grid" && (
        <div className="flex h-full flex-col justify-center">
          <div className="text-center">
            <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.28em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
            <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} style={{ transform: `translateY(${20 * (1 - titleIn)}px)`, opacity: 0.2 + titleIn * 0.8 }} placeholder="Title" />
          </div>
          <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3">
            {scene.bullets.map((bullet, index) => {
              const itemIn = motion(progress, 0.1 + index * 0.04, 0.24);
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
                    <>
                      <BulletMarker emoji={scene.bulletEmojis[index]} imageUrl={scene.bulletImageUrls[index]} accentClassName={s.accent} compact={compact} />
                      <p className={compact ? "text-[10px]" : "text-sm"}>{bullet}</p>
                    </>
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
          <div className={`rounded-[26px] border p-5 text-left ${s.card}`} style={{ transform: `translateY(${24 * (1 - cardIn)}px)`, opacity: 0.18 + cardIn * 0.82 }}><EditableText as="p" value={scene.description || scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ description: value })} className={midSize} placeholder="Description" /></div>
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
          />
        </div>
      )}

      {scene.type === "metrics" && (
        <div className="flex h-full flex-col justify-center text-center">
          <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.28em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
          <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-3 leading-tight ${titleSize} ${s.title}`} placeholder="Title" />
          <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3">
            {scene.bullets.map((bullet, index) => {
              const itemIn = motion(progress, 0.08 + index * 0.05, 0.25);
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
                      <p className={compact ? "text-[10px]" : "text-base font-medium"}>{bullet}</p>
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
            <QuoteAuthorPhoto scene={scene} progress={progress} compact={compact} />
            <div className="mb-4 text-4xl opacity-50">"</div>
            <EditableText as="h2" value={scene.title} editable={editable} multiline onCommit={(value) => onSceneChange?.({ title: value })} className={`leading-tight ${compact ? "text-base" : "text-4xl"} ${s.title} ${s.italic}`} placeholder="Quote" />
            {scene.subtitle || editable ? <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mt-5 ${midSize} opacity-75`} placeholder="Author" /> : null}
          </div>
        </div>
      )}

      {scene.type === "checklist" && (
        <div className="flex h-full flex-col justify-center">
          <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`text-center uppercase tracking-[0.28em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
          <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 text-center leading-tight ${titleSize} ${s.title}`} placeholder="Title" />
          <div className="mx-auto mt-8 grid max-w-3xl gap-3">
            {scene.bullets.map((bullet, index) => {
              const itemIn = motion(progress, 0.08 + index * 0.04, 0.24);
              return <div key={`${bullet}-${index}`} className={`flex items-center gap-3 rounded-[22px] border px-4 py-4 ${s.card}`} style={{ transform: `translateX(${-24 * (1 - itemIn)}px)`, opacity: 0.14 + itemIn * 0.86 }}><div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">{index + 1}</div><p className={compact ? "text-[10px]" : "text-sm"}>{bullet}</p></div>;
            })}
          </div>
        </div>
      )}

      {scene.type === "cta" && (
        <div className="flex h-full items-center justify-center text-center">
          <div className="max-w-4xl">
            <EditableText as="p" value={scene.eyebrow} editable={editable} onCommit={(value) => onSceneChange?.({ eyebrow: value })} className={`uppercase tracking-[0.3em] opacity-70 ${smallSize}`} placeholder="Eyebrow" />
            <EditableText as="h2" value={scene.title} editable={editable} onCommit={(value) => onSceneChange?.({ title: value })} className={`mt-4 leading-tight ${titleSize} ${s.title}`} placeholder="Title" />
            {scene.subtitle || editable ? <EditableText as="p" value={scene.subtitle} editable={editable} multiline onCommit={(value) => onSceneChange?.({ subtitle: value })} className={`mx-auto mt-5 max-w-2xl ${midSize}`} placeholder="Subtitle" /> : null}
            <div className={`mx-auto mt-8 inline-flex rounded-full border px-6 py-3 ${s.card}`}>Get started</div>
          </div>
        </div>
      )}
    </StageShell>
  );
}
