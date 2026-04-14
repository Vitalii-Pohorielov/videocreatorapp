"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { toPng } from "html-to-image";

import { BannerStylesModal } from "@/components/BannerStylesModal";
import { loadBannerProject, saveBannerProject } from "@/lib/projectPersistence";
import { bannerStylePresets, getBannerStylePreset, type BannerStyleLayoutId, type BannerStylePresetId } from "@/lib/bannerStylePresets";
import {
  bannerFontLabels,
  bannerImageTypeLabels,
  bannerSizeLabels,
  defaultBannerDraft,
  type BannerDraft,
  type BannerFontChoice,
  type BannerImageType,
  type BannerTitleAlignment,
  type BannerSize,
} from "@/lib/bannerDefinitions";

const fontFamilyMap: Record<BannerFontChoice, string> = {
  inter: 'var(--font-inter), Inter, sans-serif',
  jakarta: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
  montserrat: 'var(--font-montserrat), Montserrat, sans-serif',
  oswald: 'var(--font-oswald), Oswald, sans-serif',
  bebas: 'var(--font-bebas-neue), "Bebas Neue", sans-serif',
  playfair: 'var(--font-playfair-display), "Playfair Display", serif',
  merriweather: 'var(--font-merriweather), Merriweather, serif',
  space: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
  syne: 'var(--font-syne), "Syne", sans-serif',
};

const bannerStyleOptions = ["business", "code", "travel", "lawyer", "finance", "software"] as const;

const bannerThemeImageMap: Record<Exclude<BannerImageType, "ai">, string[]> = {
  business: [
    "/banner-themes/business/b1.avif",
    "/banner-themes/business/b2.avif",
    "/banner-themes/business/b3.avif",
    "/banner-themes/business/b4.avif",
    "/banner-themes/business/b5.avif",
  ],
  code: [
    "/banner-themes/saas/s1.avif",
    "/banner-themes/saas/s2.avif",
    "/banner-themes/saas/s3.avif",
    "/banner-themes/saas/s4.avif",
    "/banner-themes/saas/s5.avif",
  ],
  travel: [
    "/banner-themes/travel/t1.avif",
    "/banner-themes/travel/t2.avif",
    "/banner-themes/travel/t3.avif",
    "/banner-themes/travel/t4.avif",
    "/banner-themes/travel/t5.avif",
  ],
  lawyer: [
    "/banner-themes/lawyer/l1.jpg",
    "/banner-themes/lawyer/l2.jpg",
    "/banner-themes/lawyer/l3.jpg",
    "/banner-themes/lawyer/l4.jpg",
    "/banner-themes/lawyer/l5.jpg",
  ],
  finance: [
    "/banner-themes/finance/f1.jpg",
    "/banner-themes/finance/f2.jpg",
    "/banner-themes/finance/f3.jpg",
    "/banner-themes/finance/f4.jpg",
    "/banner-themes/finance/f5.jpg",
  ],
  software: [
    "/banner-themes/software/s1.jpg",
    "/banner-themes/software/s2.jpg",
    "/banner-themes/software/s3.jpg",
    "/banner-themes/software/s4.jpg",
    "/banner-themes/software/s5.jpg",
  ],
};

const themeImageMap: Record<BannerImageType, string> = {
  business: bannerThemeImageMap.business[0],
  code: bannerThemeImageMap.code[0],
  ai: bannerThemeImageMap.code[0],
  travel: bannerThemeImageMap.travel[0],
  lawyer: bannerThemeImageMap.lawyer[0],
  finance: bannerThemeImageMap.finance[0],
  software: bannerThemeImageMap.software[0],
};

const bannerImageVariantMap: Record<BannerImageType, string[]> = {
  business: bannerThemeImageMap.business,
  code: bannerThemeImageMap.code,
  ai: bannerThemeImageMap.code,
  travel: bannerThemeImageMap.travel,
  lawyer: bannerThemeImageMap.lawyer,
  finance: bannerThemeImageMap.finance,
  software: bannerThemeImageMap.software,
};

const bannerCompositionVariants = [
  {
    cardWidth: "max-w-5xl",
    cardPadding: "px-5 py-8 sm:px-10 sm:py-12",
    align: "justify-center",
    titleAlign: "text-center",
    titleScale: "transform-none",
  },
  {
    cardWidth: "max-w-4xl",
    cardPadding: "px-5 py-7 sm:px-8 sm:py-10",
    align: "justify-start",
    titleAlign: "text-left",
    titleScale: "translate-y-2 -translate-x-2",
  },
  {
    cardWidth: "max-w-4xl",
    cardPadding: "px-6 py-6 sm:px-10 sm:py-10",
    align: "justify-center",
    titleAlign: "text-center",
    titleScale: "scale-95",
  },
] as const;

const bannerCompositionLabels = [
  {
    label: "Center stack",
    description: "Balanced composition with centered type and breathing room.",
  },
  {
    label: "Left anchored",
    description: "Editorial alignment with the title pulled to the left.",
  },
  {
    label: "Compact card",
    description: "Tighter framing for a denser, more punchy banner.",
  },
] as const;

const bannerAssetOptions = [
  {
    type: "business",
    label: "Business",
    description: "Clean product and boardroom-inspired imagery.",
  },
  {
    type: "code",
    label: "Code",
    description: "Modern product-led visuals for apps and landing pages.",
  },
  {
    type: "ai",
    label: "AI",
    description: "Purple-leaning futuristic brand energy.",
  },
  {
    type: "travel",
    label: "Travel",
    description: "Warm, cinematic destination photography.",
  },
  {
    type: "lawyer",
    label: "Law",
    description: "Serious, polished visuals for legal services.",
  },
  {
    type: "finance",
    label: "Finance",
    description: "Trustworthy, analytical imagery for money and markets.",
  },
  {
    type: "software",
    label: "Software",
    description: "Clean, technical visuals for product and code teams.",
  },
] as const;

const bannerAspectClassName: Record<BannerSize, string> = {
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
};

const bannerAspectRatio: Record<BannerSize, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
};

const bannerTitleClassName: Record<BannerSize, string> = {
  "1:1": "w-full text-4xl sm:text-5xl",
  "4:3": "w-full text-5xl sm:text-6xl",
  "16:9": "w-full text-4xl sm:text-6xl lg:text-7xl",
};

const bannerTitleAlignmentClassName: Record<BannerTitleAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const bannerTitleSizeBasePx: Record<BannerSize, number> = {
  "1:1": 58,
  "4:3": 72,
  "16:9": 88,
};

type BannerWorkspaceProps = {
  initialProjectId?: string | null;
};

type BannerWorkspaceSnapshot = {
  bannerName: string;
  draft: BannerDraft;
  activeStylePresetId: BannerStylePresetId;
  bannerPositionIndex: number;
  bannerAssetVariantIndex: number;
};

function ControlCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/72 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.28)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <label className="relative block h-8 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none border-0 bg-transparent opacity-0"
          />
          <span className="pointer-events-none absolute inset-0 z-0 block rounded-xl" style={{ backgroundColor: value }} />
        </label>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>
    </label>
  );
}

function EditableText({
  value,
  onChange,
  className,
  style,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
  style?: CSSProperties;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div
      role="textbox"
      aria-label={ariaLabel}
      contentEditable
      suppressContentEditableWarning
      onInput={(event) => onChange(event.currentTarget.textContent ?? "")}
      onBlur={(event) => onChange(event.currentTarget.textContent ?? "")}
      className={className}
      style={style}
    >
      {value || placeholder}
    </div>
  );
}

function TitleAlignmentButton({
  active,
  label,
  alignment,
  onClick,
}: {
  active: boolean;
  label: string;
  alignment: BannerTitleAlignment;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
        active
          ? "cursor-default border-white/8 bg-white/10 text-white/30 shadow-none"
          : "border-white/10 bg-black/60 text-white/70 hover:border-white/25 hover:bg-black/80 hover:text-white"
      }`}
    >
      <AlignmentGlyph alignment={alignment} active={active} />
    </button>
  );
}

function AlignmentGlyph({
  alignment,
  active,
}: {
  alignment: BannerTitleAlignment;
  active: boolean;
}) {
  const stroke = active ? "currentColor" : "currentColor";
  const cls = "h-3.5 w-3.5";

  if (alignment === "left") {
    return (
      <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden="true">
        <path d="M2 4h12" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 8h9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 12h12" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (alignment === "center") {
    return (
      <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden="true">
        <path d="M3 4h10" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M1.5 8h13" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 12h10" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" fill="none" className={cls} aria-hidden="true">
      <path d="M2 4h12" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 8h9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 12h12" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MirrorEdgeButton({
  side,
  label,
  active,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-95 ${
        active
          ? "border-white/20 bg-slate-950/75 text-white shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
          : "border-white/12 bg-slate-950/40 text-white/55 hover:border-white/20 hover:bg-slate-950/65 hover:text-white"
      }`}
    >
      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 transition group-hover:scale-105" aria-hidden="true">
        {side === "left" ? (
          <path
            d="M10 3.75 5.75 8 10 12.25"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M6 3.75 10.25 8 6 12.25"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

function TitleEditor({
  value,
  onChange,
  alignment,
  onAlignmentChange,
  mirrored,
  onMirrorChange,
  className,
  style,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  alignment: BannerTitleAlignment;
  onAlignmentChange: (alignment: BannerTitleAlignment) => void;
  mirrored: boolean;
  onMirrorChange: (value: boolean) => void;
  className: string;
  style?: CSSProperties;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div
      className={`group relative w-full max-w-full ${bannerTitleAlignmentClassName[alignment]}`}
      style={{ transform: mirrored ? "scaleX(-1)" : undefined, transformOrigin: "center" }}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 z-50 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/70 p-1 shadow-[0_14px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <TitleAlignmentButton label="Align left" active={alignment === "left"} alignment="left" onClick={() => onAlignmentChange("left")} />
          <TitleAlignmentButton label="Align center" active={alignment === "center"} alignment="center" onClick={() => onAlignmentChange("center")} />
          <TitleAlignmentButton label="Align right" active={alignment === "right"} alignment="right" onClick={() => onAlignmentChange("right")} />
        </div>
      </div>
      <div className="pointer-events-none absolute left-0 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <MirrorEdgeButton side="left" label="Swap title and image left" active={mirrored} onClick={() => onMirrorChange(!mirrored)} />
      </div>
      <div className="pointer-events-none absolute right-0 top-1/2 z-50 flex translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <MirrorEdgeButton side="right" label="Swap title and image right" active={!mirrored} onClick={() => onMirrorChange(!mirrored)} />
      </div>
      <EditableText
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={className}
        style={{
          ...style,
          maxWidth: "100%",
          overflowWrap: "anywhere",
          textAlign: alignment,
        }}
      />
    </div>
  );
}

function BannerTemplatePreview({
  layout,
  draft,
  selectedBannerImage,
  titleFontSizePx,
  onTitleChange,
  onTitleAlignmentChange,
  onTitleMirrorChange,
}: {
  layout: BannerStyleLayoutId;
  draft: BannerDraft;
  selectedBannerImage: string;
  titleFontSizePx: number;
  onTitleChange: (value: string) => void;
  onTitleAlignmentChange: (alignment: BannerTitleAlignment) => void;
  onTitleMirrorChange: (value: boolean) => void;
}) {
  const titleClassName = `block w-full max-w-full min-w-0 rounded-[28px] px-3 py-2 font-semibold uppercase leading-[0.9] tracking-[-0.07em] outline-none transition focus:bg-white/10 whitespace-normal break-words [overflow-wrap:anywhere] ${
    bannerTitleClassName[draft.size]
  }`;

  const titleNode = (
    <TitleEditor
      ariaLabel="Banner title"
      placeholder="Build a banner that feels ready to ship"
      value={draft.title}
      onChange={onTitleChange}
      alignment={draft.titleAlignment}
      onAlignmentChange={onTitleAlignmentChange}
      mirrored={draft.titleImageSwap}
      onMirrorChange={onTitleMirrorChange}
      className={titleClassName}
      style={{
        fontSize: `${titleFontSizePx}px`,
        lineHeight: "0.9",
        maxWidth: "100%",
        overflowWrap: "anywhere",
      }}
    />
  );
  const accentStyle = { backgroundColor: draft.accentColor };
  const accentBorderStyle = { borderColor: draft.accentColor };

  const spriteSet = (
    <>
      <div className="absolute left-7 top-7 h-2.5 w-2.5 rounded-full bg-white/80" />
      <div className="absolute left-16 top-14 h-2 w-2 rounded-full bg-white/50" />
      <div className="absolute right-10 top-10 h-2.5 w-2.5 rounded-full bg-white/70" />
      <div className="absolute right-16 bottom-12 h-1.5 w-1.5 rounded-full bg-white/50" />
      <div className="absolute left-20 bottom-14 h-px w-10 bg-white/35" />
      <div className="absolute right-20 top-1/2 h-px w-12 bg-white/25" />
    </>
  );
  switch (layout) {
    case "aurora":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.26),transparent_16%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_18%)]" />
          <div className="absolute -left-10 -top-8 h-44 w-44 rounded-full blur-3xl" style={{ ...accentStyle, opacity: 0.18 }} />
          <div className="absolute right-[-6%] top-[-8%] h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: draft.textColor, opacity: 0.1 }} />
          {spriteSet}
          <div className="absolute left-6 top-8 z-40 w-[70%]">
            <div className="relative rounded-[34px] border border-white/15 bg-black/20 px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl">
              <div className="absolute -left-2 -top-2 h-6 w-6 rounded-full border border-white/30 bg-white/10" />
              <div className="absolute right-4 top-4 h-14 w-14 rounded-full border border-sky-300/30 bg-sky-300/10" />
              {titleNode}
            </div>
          </div>
          <div className="absolute right-4 top-4 z-10 h-[82%] w-[60%] overflow-hidden rounded-[42px] border border-white/20 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.34)), url(${selectedBannerImage})` }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.3),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.06),transparent_38%)]" />
          </div>
          <div className="absolute bottom-6 left-6 z-20 h-14 w-14 rounded-full border border-white/20 bg-white/10 shadow-[0_0_40px_rgba(125,211,252,0.2)]" />
          <div className="absolute bottom-8 right-[52%] z-20 h-12 w-12 rounded-full bg-white/8 backdrop-blur-md" />
        </div>
      );
    case "editorial":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.65),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(180,120,90,0.18),transparent_18%)]" />
          <div className="absolute right-[-8%] top-[-8%] h-56 w-56 rounded-full blur-3xl" style={{ ...accentStyle, opacity: 0.16 }} />
          <div className="absolute left-[-6%] bottom-[-8%] h-60 w-60 rounded-full blur-3xl" style={{ backgroundColor: draft.textColor, opacity: 0.12 }} />
          {spriteSet}
          <div className="absolute left-4 top-4 bottom-4 z-0 w-[56%] overflow-hidden rounded-[36px] shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.24)), url(${selectedBannerImage})` }}
            />
          </div>
          <div className="absolute right-4 top-6 z-20 flex h-[76%] w-[70%] items-center">
            <div className="relative w-full rounded-[34px] border border-black/8 bg-white/52 px-6 py-7 shadow-[0_22px_60px_rgba(0,0,0,0.12)] backdrop-blur-md">
              <div className="absolute left-5 top-5 h-px w-20 bg-black/15" />
              <div className="absolute right-5 top-5 h-16 w-16 rounded-full border border-black/10 bg-black/5" />
              <div className="absolute left-6 bottom-5 h-3 w-3 rounded-full" style={accentStyle} />
              {titleNode}
            </div>
          </div>
          <div className="absolute bottom-6 left-[48%] z-10 h-20 w-28 rounded-[28px] bg-white/35 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm" />
          <div className="absolute bottom-5 right-6 z-10 h-16 w-16 rounded-full border border-black/10 bg-white/55" />
        </div>
      );
    case "luxe":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_28%,rgba(245,197,66,0.22),transparent_18%),radial-gradient(circle_at_bottom_left,rgba(245,197,66,0.12),transparent_20%)]" />
          <div className="absolute left-6 top-6 h-3 w-3 rounded-full" style={accentStyle} />
          <div className="absolute right-8 top-8 h-12 w-12 rounded-full border" style={{ ...accentBorderStyle, opacity: 0.35 }} />
          <div className="absolute right-16 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border" style={{ ...accentBorderStyle, backgroundColor: draft.accentColor, opacity: 0.08 }} />
          {spriteSet}
          <div className="absolute left-4 top-8 z-0 h-[82%] w-[58%] overflow-hidden rounded-[40px] border border-amber-200/20 bg-black/32 shadow-[0_28px_100px_rgba(0,0,0,0.42)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.08), rgba(2,6,23,0.34)), url(${selectedBannerImage})` }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_24%,rgba(245,197,66,0.18),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%)]" />
          </div>
          <div className="absolute right-5 top-8 z-20 flex h-[80%] w-[70%] items-center justify-end">
            <div className="relative w-full rounded-[34px] border border-amber-300/18 bg-black/42 px-6 py-6 text-right shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-md">
              <div className="absolute right-5 top-5 h-16 w-16 rounded-full border" style={{ ...accentBorderStyle, backgroundColor: draft.accentColor, opacity: 0.08 }} />
              <div className="absolute left-6 bottom-6 h-px w-28 bg-gradient-to-r from-transparent to-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${draft.accentColor}, transparent)` }} />
              {titleNode}
            </div>
          </div>
          <div className="absolute bottom-6 left-6 z-20 h-16 w-16 rounded-full border shadow-[0_0_40px_rgba(245,197,66,0.18)]" style={{ ...accentBorderStyle, backgroundColor: draft.accentColor, opacity: 0.1 }} />
        </div>
      );
    case "poster":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.74),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(17,17,17,0.08),transparent_24%)]" />
          <div className="absolute inset-x-6 top-6 h-px" style={{ backgroundColor: draft.accentColor, opacity: 0.12 }} />
          <div className="absolute inset-x-6 bottom-6 h-px" style={{ backgroundColor: draft.accentColor, opacity: 0.12 }} />
          {spriteSet}
          <div className="absolute left-5 top-16 z-0 h-[68%] w-[58%] overflow-hidden rounded-[30px] shadow-[0_20px_54px_rgba(0,0,0,0.16)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.22)), url(${selectedBannerImage})` }}
            />
          </div>
          <div className="absolute inset-x-6 top-8 z-30 flex justify-center">
            <div className="w-[70%] min-w-[70%] rounded-[28px] bg-white/72 px-6 py-4 text-center shadow-[0_18px_50px_rgba(0,0,0,0.1)] backdrop-blur-md">
              {titleNode}
            </div>
          </div>
          <div className="absolute right-6 bottom-8 z-20 h-[38%] w-[56%] overflow-hidden rounded-[34px] border border-black/8 bg-black/5 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(17,17,17,0.08),transparent_36%)]" />
          </div>
          <div className="absolute left-[46%] bottom-10 z-20 h-24 w-24 rounded-full border" style={{ ...accentBorderStyle, backgroundColor: draft.accentColor, opacity: 0.2 }} />
        </div>
      );
    case "gradient":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.16),transparent_20%),radial-gradient(circle_at_72%_26%,rgba(255,255,255,0.12),transparent_16%)]" />
          <div className="absolute left-8 top-8 h-8 w-8 rounded-full" style={{ ...accentStyle, opacity: 0.22 }} />
          <div className="absolute right-6 top-10 z-0 h-[40%] w-[36%] rounded-[46px] shadow-[0_0_0_12px_rgba(255,255,255,0.08)]" style={{ backgroundColor: draft.accentColor, opacity: 0.88 }} />
          {spriteSet}
          <div className="absolute left-8 top-8 z-30 w-[70%] min-w-[70%]">
            <div className="rounded-[30px] bg-black/24 px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-md">
              {titleNode}
            </div>
          </div>
          <div className="absolute bottom-8 right-8 z-20 h-[48%] w-[56%] overflow-hidden rounded-[48px] border border-white/16 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.28)), url(${selectedBannerImage})` }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.2),transparent_35%)]" />
          </div>
          <div className="absolute bottom-6 left-6 z-20 flex gap-2">
            <div className="h-10 w-10 rounded-full" style={{ ...accentStyle, opacity: 0.9 }} />
            <div className="h-10 w-10 rounded-full" style={{ ...accentStyle, opacity: 0.7 }} />
            <div className="h-10 w-10 rounded-full bg-white/25" />
          </div>
        </div>
      );
    case "frame-strip":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_100%] opacity-25" />
          <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-[56%] overflow-hidden rounded-[28px] border border-white/10 bg-black/45 shadow-[0_26px_90px_rgba(0,0,0,0.4)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.48)), url(${selectedBannerImage})` }}
            />
          </div>
          <div className="absolute right-5 top-5 z-30 flex h-[calc(100%-2.5rem)] w-[70%] min-w-[70%] flex-col justify-between">
            <div className="rounded-[30px] bg-white/[0.06] px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
              <div className="mb-4 h-1 w-20 bg-white/30" />
              {titleNode}
            </div>
            <div className="rounded-[26px] border border-white/10 bg-black/24 px-5 py-5 backdrop-blur-md">
              <div className="h-2 w-24 rounded-full" style={accentStyle} />
              <div className="mt-4 h-px w-full bg-white/10" />
            </div>
          </div>
        </div>
      );
    case "circle-badge":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.16),transparent_20%)]" />
          <div className="absolute left-1/2 top-1/2 h-[68%] w-[68%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-white/12 shadow-[0_28px_100px_rgba(0,0,0,0.38)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.1), rgba(2,6,23,0.46)), url(${selectedBannerImage})` }}
            />
          </div>
          <div className="absolute left-6 bottom-6 z-30 w-[70%] min-w-[70%] rounded-[32px] bg-white/10 px-6 py-5 backdrop-blur-md">
            {titleNode}
          </div>
          <div className="absolute right-7 bottom-8 z-30 h-16 w-16 rounded-full border border-white/20 bg-white/5" />
        </div>
      );
    case "brutal-grid":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:96px_96px] opacity-20" />
          <div className="absolute left-4 top-4 z-20 h-[72%] w-[58%] overflow-hidden border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.16), rgba(2,6,23,0.56)), url(${selectedBannerImage})` }}
            />
          </div>
          <div className="absolute right-4 top-4 z-30 flex h-[calc(100%-2rem)] w-[70%] min-w-[70%] flex-col justify-between">
            <div className="ml-auto w-full min-w-full rounded-[18px] bg-white px-5 py-4 text-right text-black">
              <div className="mt-1">{titleNode}</div>
            </div>
            <div className="rounded-[22px] bg-white/10 px-5 py-5 backdrop-blur-sm">
              <div className="h-2 w-24 bg-white" />
              <div className="mt-4 h-px w-full bg-white/15" />
            </div>
          </div>
        </div>
      );
    case "slab-cut":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_36%,transparent_64%,rgba(17,24,39,0.12)_100%)]" />
          <div className="absolute right-0 top-0 h-full w-[42%] bg-black/8" />
          <div className="absolute left-4 top-4 z-20 h-[82%] w-[58%] overflow-hidden rounded-[30px] border border-black/10 shadow-[0_26px_80px_rgba(0,0,0,0.16)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.22)), url(${selectedBannerImage})` }}
            />
          </div>
          <div className="absolute right-6 top-6 z-30 flex h-[calc(100%-3rem)] w-[70%] min-w-[70%] flex-col justify-between">
            <div className="rounded-[30px] bg-black/5 px-6 py-6 backdrop-blur-md">
              <div className="mt-5 w-full min-w-full rounded-[18px] bg-white px-4 py-3 text-black">
                {titleNode}
              </div>
            </div>
            <div className="rounded-[18px] border border-black/10 bg-white/50 px-5 py-4">
              <div className="h-1 w-16 bg-black" />
            </div>
          </div>
        </div>
      );
    case "glass-label":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.16),transparent_18%),radial-gradient(circle_at_80%_15%,rgba(192,132,252,0.16),transparent_18%)]" />
          <div className="absolute left-4 top-4 z-0 h-[84%] w-[60%] overflow-hidden rounded-[36px] shadow-[0_26px_90px_rgba(0,0,0,0.36)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.1), rgba(2,6,23,0.38)), url(${selectedBannerImage})` }}
            />
          </div>
          <div className="absolute right-4 top-8 z-30 flex h-[78%] w-[70%] min-w-[70%] flex-col justify-center gap-3">
            <div className="rounded-[28px] border border-white/12 bg-white/8 px-6 py-6 backdrop-blur-md">
              {titleNode}
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 px-5 py-4 backdrop-blur-md">
              <div className="h-px w-20 bg-white/30" />
            </div>
          </div>
        </div>
      );
    case "poster-burst":
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.08),transparent_24%)]" />
          <div className="absolute right-4 top-4 z-20 h-[72%] w-[56%] overflow-hidden rounded-[26px] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.28)), url(${selectedBannerImage})` }}
            />
          </div>
          <div className="absolute left-5 top-5 z-30 w-[70%] min-w-[70%] rounded-[18px] bg-white px-5 py-4 text-black">
            {titleNode}
          </div>
        </div>
      );
    case "mono":
    default:
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25" />
          <div className="absolute left-[-8%] top-[-4%] h-[84%] w-[54%] overflow-hidden rounded-[44px] bg-black/65 shadow-[0_28px_90px_rgba(0,0,0,0.48)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.08), rgba(2,6,23,0.46)), url(${selectedBannerImage})`, filter: "grayscale(1) contrast(1.05)" }}
            />
          </div>
          <div className="absolute right-6 top-10 z-30 w-[70%] min-w-[70%]">
            <div className="rounded-[30px] bg-white/6 px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
              {titleNode}
            </div>
          </div>
          <div className="absolute right-8 top-8 h-3 w-3 rounded-full" style={accentStyle} />
          <div className="absolute right-10 bottom-10 h-20 w-20 rounded-full border border-white/16 bg-white/5" />
          <div className="absolute left-[40%] bottom-8 z-20 h-24 w-24 rounded-[32px] bg-white/8 backdrop-blur-sm" />
          <div className="absolute bottom-6 left-6 h-px w-24" style={{ backgroundColor: draft.accentColor, opacity: 0.2 }} />
          <div className="absolute left-6 bottom-10 h-3 w-3 rounded-full" style={accentStyle} />
        </div>
      );
  }
}

export function BannerWorkspace({ initialProjectId = null }: BannerWorkspaceProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BannerDraft>(defaultBannerDraft);
  const [bannerName, setBannerName] = useState("Untitled banner");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false);
  const [isStylePopupOpen, setIsStylePopupOpen] = useState(false);
  const [activeStylePresetId, setActiveStylePresetId] = useState<BannerStylePresetId>("aurora-burst");
  const [bannerPositionIndex, setBannerPositionIndex] = useState(0);
  const [bannerAssetVariantIndex, setBannerAssetVariantIndex] = useState(0);
  const [previewAreaSize, setPreviewAreaSize] = useState({ width: 0, height: 0 });
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const previewFontFamily = fontFamilyMap[draft.fontChoice];
  const previewAreaRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const sizeMenuRef = useRef<HTMLDivElement | null>(null);
  const didHydrateProject = useRef<string | null | undefined>(undefined);
  const lastSavedSignatureRef = useRef("");
  const saveInFlightRef = useRef(false);
  const queuedSaveReasonRef = useRef<"auto" | "manual" | null>(null);
  const bannerStyleLabel = bannerImageTypeLabels[draft.imageType];
  const selectedVariantImages = bannerImageVariantMap[draft.imageType] ?? [themeImageMap[draft.imageType]];
  const selectedBannerImage = selectedVariantImages[bannerAssetVariantIndex % selectedVariantImages.length] ?? themeImageMap[draft.imageType];
  const compositionVariant = bannerCompositionVariants[bannerPositionIndex % bannerCompositionVariants.length];
  const compositionLabel = bannerCompositionLabels[bannerPositionIndex % bannerCompositionLabels.length] ?? bannerCompositionLabels[0];
  const activeStylePreset = getBannerStylePreset(activeStylePresetId);
  const titleFontSizePx = Math.round(bannerTitleSizeBasePx[draft.size] * (draft.titleScale / 100));
  const previewFitWidth =
    previewAreaSize.width > 0 && previewAreaSize.height > 0
      ? Math.min(previewAreaSize.width, previewAreaSize.height * bannerAspectRatio[draft.size])
      : undefined;
  const projectSaveSignature = useMemo(
    () =>
      JSON.stringify({
        bannerName,
        draft,
        activeStylePresetId,
        bannerPositionIndex,
        bannerAssetVariantIndex,
      }),
    [activeStylePresetId, bannerAssetVariantIndex, bannerName, bannerPositionIndex, draft],
  );

  const applySnapshot = useCallback((snapshot: BannerWorkspaceSnapshot, nextProjectId: string | null) => {
    setProjectId(nextProjectId);
    setBannerName(snapshot.bannerName);
    setDraft(snapshot.draft);
    setActiveStylePresetId(snapshot.activeStylePresetId);
    setBannerPositionIndex(snapshot.bannerPositionIndex);
    setBannerAssetVariantIndex(snapshot.bannerAssetVariantIndex);
  }, []);

  const updateField = <K extends keyof BannerDraft>(key: K, value: BannerDraft[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateAssetTheme = (imageType: BannerImageType) => {
    updateField("imageType", imageType);
    setBannerAssetVariantIndex(0);
  };

  const updateBannerPosition = (index: number) => {
    const nextIndex = ((index % bannerCompositionVariants.length) + bannerCompositionVariants.length) % bannerCompositionVariants.length;
    setBannerPositionIndex(nextIndex);
  };

  const updateBannerAssetVariant = (index: number) => {
    const nextIndex = ((index % selectedVariantImages.length) + selectedVariantImages.length) % selectedVariantImages.length;
    setBannerAssetVariantIndex(nextIndex);
  };

  const applyStylePreset = (presetId: BannerStylePresetId) => {
    const preset = getBannerStylePreset(presetId);
    setDraft((current) => ({
      ...current,
      backgroundColor: preset.backgroundColor,
      accentColor: preset.accentColor,
      textColor: preset.textColor,
      fontChoice: preset.fontChoice,
      imageType: preset.imageType,
      titleScale: preset.titleScale,
    }));
    setBannerPositionIndex(preset.positionIndex);
    setBannerAssetVariantIndex(preset.assetVariantIndex);
    setActiveStylePresetId(preset.id);
  };

  const generateBanner = () => {
    const preset = bannerStylePresets[Math.floor(Math.random() * bannerStylePresets.length)] ?? bannerStylePresets[0];
    const nextPositionIndex =
      bannerCompositionVariants.length > 1
        ? (bannerPositionIndex + 1 + Math.floor(Math.random() * (bannerCompositionVariants.length - 1))) % bannerCompositionVariants.length
        : 0;
    const nextAssetVariantIndex = Math.floor(Math.random() * selectedVariantImages.length);
    const alignmentOptions: BannerTitleAlignment[] = ["left", "center", "right"];
    const nextAlignmentCandidates = alignmentOptions.filter((alignment) => alignment !== draft.titleAlignment);
    const nextTitleAlignment =
      nextAlignmentCandidates[Math.floor(Math.random() * nextAlignmentCandidates.length)] ?? draft.titleAlignment;
    const nextTitleImageSwap = Math.random() >= 0.5;
    setDraft((current) => ({
      ...current,
      backgroundColor: preset.backgroundColor,
      accentColor: preset.accentColor,
      textColor: preset.textColor,
      fontChoice: preset.fontChoice,
      titleAlignment: nextTitleAlignment,
      titleImageSwap: nextTitleImageSwap,
    }));
    setBannerPositionIndex(nextPositionIndex);
    setBannerAssetVariantIndex(nextAssetVariantIndex);
    setActiveStylePresetId(preset.id);
  };

  const saveCurrentBanner = useCallback(
    async (reason: "auto" | "manual") => {
      if (saveInFlightRef.current) {
        queuedSaveReasonRef.current = queuedSaveReasonRef.current === "manual" || reason === "manual" ? "manual" : "auto";
        return;
      }

      saveInFlightRef.current = true;
      try {
        const currentSignature = JSON.stringify({
          bannerName,
          draft,
          activeStylePresetId,
          bannerPositionIndex,
          bannerAssetVariantIndex,
        });

        if (reason === "auto" && currentSignature === lastSavedSignatureRef.current) {
          return;
        }

        if (reason === "manual") {
          setIsSaving(true);
          setCloudStatus("Saving banner...");
        }

        const project = await saveBannerProject({
          projectId,
          projectName: bannerName,
          draft,
          stylePresetId: activeStylePresetId,
          bannerPositionIndex,
          bannerAssetVariantIndex,
        });

        setProjectId(project.id);
        setBannerName(project.name);
        window.history.replaceState({}, "", `/banner?project=${project.id}`);
        lastSavedSignatureRef.current = JSON.stringify({
          bannerName: project.name,
          draft,
          activeStylePresetId,
          bannerPositionIndex,
          bannerAssetVariantIndex,
        });
        setCloudStatus(reason === "manual" ? `Saved "${project.name}".` : `Autosaved "${project.name}".`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save banner.";
        setCloudStatus(message);
      } finally {
        saveInFlightRef.current = false;
        if (reason === "manual") {
          setIsSaving(false);
        }

        const queuedReason = queuedSaveReasonRef.current;
        queuedSaveReasonRef.current = null;
        if (queuedReason) {
          void saveCurrentBanner(queuedReason);
        }
      }
    },
    [activeStylePresetId, bannerAssetVariantIndex, bannerName, bannerPositionIndex, draft, projectId],
  );

  useEffect(() => {
    if (initialProjectId) return;
    const savedBannerName = window.localStorage.getItem("cliplab-banner-name");
    const savedBannerDraft = window.localStorage.getItem("cliplab-banner-draft");
    const savedBannerStyleState = window.localStorage.getItem("cliplab-banner-style-state");
    const savedStylePresetId = window.localStorage.getItem("cliplab-banner-style-preset-id");

    if (savedBannerName) {
      setBannerName(savedBannerName);
    }

    if (savedBannerDraft) {
      try {
        const parsed = JSON.parse(savedBannerDraft) as Partial<Omit<BannerDraft, "imageType">> & { imageType?: unknown };
        const rawImageType = typeof parsed.imageType === "string" ? parsed.imageType : undefined;
        const normalizedImageType = rawImageType === "saas" ? "code" : rawImageType;
        setDraft((current) => ({
          ...current,
          ...parsed,
          imageType: (normalizedImageType as BannerDraft["imageType"] | undefined) ?? current.imageType,
        }));
      } catch {
        // Ignore malformed local drafts and keep defaults.
      }
    }

    if (savedBannerStyleState) {
      try {
        const parsed = JSON.parse(savedBannerStyleState) as Partial<{
          bannerPositionIndex: number;
          bannerAssetVariantIndex: number;
        }>;
        if (Number.isFinite(parsed.bannerPositionIndex ?? NaN)) {
          setBannerPositionIndex(Math.max(0, Math.floor(parsed.bannerPositionIndex ?? 0)) % bannerCompositionVariants.length);
        }
        if (Number.isFinite(parsed.bannerAssetVariantIndex ?? NaN)) {
          setBannerAssetVariantIndex(Math.max(0, Math.floor(parsed.bannerAssetVariantIndex ?? 0)) % 5);
        }
      } catch {
        // Ignore malformed style state and keep defaults.
      }
    }

    if (savedStylePresetId) {
      const maybePreset = bannerStylePresets.find((preset) => preset.id === savedStylePresetId);
      if (maybePreset) {
        setActiveStylePresetId(maybePreset.id);
      }
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (didHydrateProject.current === initialProjectId) return;
    didHydrateProject.current = initialProjectId;

    if (!initialProjectId) {
      setProjectId(null);
      return;
    }

    setIsSaving(true);
    setCloudStatus(`Loading banner ${initialProjectId}...`);

    loadBannerProject(initialProjectId)
      .then((project) => {
        applySnapshot(
          {
            bannerName: project.name,
            draft: project.payload.draft,
            activeStylePresetId: project.payload.stylePresetId,
            bannerPositionIndex: project.payload.bannerPositionIndex,
            bannerAssetVariantIndex: project.payload.bannerAssetVariantIndex,
          },
          project.id,
        );
        lastSavedSignatureRef.current = JSON.stringify({
          bannerName: project.name,
          draft: project.payload.draft,
          activeStylePresetId: project.payload.stylePresetId,
          bannerPositionIndex: project.payload.bannerPositionIndex,
          bannerAssetVariantIndex: project.payload.bannerAssetVariantIndex,
        });
        setCloudStatus(`Loaded "${project.name}".`);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Could not load banner.";
        setCloudStatus(message);
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [applySnapshot, initialProjectId]);

  useEffect(() => {
    if (!previewAreaRef.current) return;

    const element = previewAreaRef.current;
    const updateSize = () => {
      setPreviewAreaSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem("cliplab-banner-name", bannerName.trim() || "Untitled banner");
      window.localStorage.setItem("cliplab-banner-draft", JSON.stringify(draft));
      window.localStorage.setItem(
        "cliplab-banner-style-state",
        JSON.stringify({
          bannerPositionIndex,
          bannerAssetVariantIndex,
        }),
      );
      window.localStorage.setItem("cliplab-banner-style-preset-id", activeStylePresetId);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [activeStylePresetId, bannerAssetVariantIndex, bannerName, bannerPositionIndex, draft]);

  useEffect(() => {
    if (initialProjectId && projectId !== initialProjectId) return;
    if (projectSaveSignature === lastSavedSignatureRef.current) return;

    const timeoutId = window.setTimeout(() => {
      void saveCurrentBanner("auto");
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [initialProjectId, projectId, projectSaveSignature, saveCurrentBanner]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!sizeMenuRef.current?.contains(event.target as Node)) {
        setIsSizeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSizeMenuOpen(false);
        setIsStylePopupOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isStylePopupOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isStylePopupOpen]);

  const handleDownload = async () => {
    if (!previewRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: draft.backgroundColor,
      });

      const link = document.createElement("a");
      link.download = `${bannerName.trim() || "untitled-banner"}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveBanner = () => {
    void saveCurrentBanner("manual");
  };

  return (
    <>
      <main className="h-[calc(100vh-72px)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_32%),linear-gradient(180deg,#060b16_0%,#0b1220_44%,#0f172a_100%)] px-4 py-6 text-slate-100">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6">
        <section className="relative z-40 overflow-visible rounded-[28px] border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_16px_40px_rgba(2,6,23,0.28)] backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <input
                value={bannerName}
                onChange={(event) => setBannerName(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                placeholder="Banner name"
              />
              <div ref={sizeMenuRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setIsSizeMenuOpen((open) => !open)}
                  className="inline-flex h-10 w-[112px] items-center justify-between rounded-xl border border-white/10 bg-slate-950/90 px-3 text-sm text-slate-100 shadow-[0_12px_24px_rgba(2,6,23,0.28)] transition hover:bg-slate-900"
                  aria-haspopup="menu"
                  aria-expanded={isSizeMenuOpen}
                >
                  <span>{bannerSizeLabels[draft.size]}</span>
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 text-slate-400 transition ${isSizeMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </button>
                {isSizeMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[180px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-[0_24px_60px_rgba(2,6,23,0.55)]">
                    {(Object.keys(bannerSizeLabels) as BannerSize[]).map((size) => {
                      const active = draft.size === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            updateField("size", size);
                            setIsSizeMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                            active ? "bg-sky-400/12 text-sky-200" : "text-slate-200 hover:bg-white/[0.06]"
                          }`}
                        >
                          <span>{bannerSizeLabels[size]}</span>
                          {active ? <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setIsStylePopupOpen((open) => !open)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
                  isStylePopupOpen
                    ? "border-sky-400/35 bg-sky-400/12 text-sky-100"
                    : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                }`}
                aria-haspopup="dialog"
                aria-expanded={isStylePopupOpen}
              >
                <span>Styles</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                  {compositionLabel.label}
                </span>
              </button>
              <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <span className="shrink-0 text-sm font-medium text-slate-200">Font size</span>
                <input
                  type="range"
                  min={70}
                  max={150}
                  step={1}
                  value={draft.titleScale}
                  onChange={(event) => updateField("titleScale", Number(event.target.value))}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-400"
                />
                <span className="w-14 shrink-0 text-right text-sm font-medium text-slate-300">{titleFontSizePx}px</span>
              </label>
              <button
                type="button"
                onClick={handleSaveBanner}
                disabled={isSaving}
                className="shrink-0 rounded-xl border border-sky-400/25 bg-sky-400/12 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/18 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={isDownloading}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-60"
              >
                {isDownloading ? "Downloading..." : "Download"}
              </button>
            </div>
            {cloudStatus ? <p className="text-sm text-slate-400 xl:max-w-[320px] xl:text-right">{cloudStatus}</p> : null}
          </div>
        </section>

        <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto xl:pr-1">
            <ControlCard
              title="Generate banner"
              description="Build the banner from the chosen image, font, and title, then keep tweaking colors if you want."
            >
              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {bannerStyleOptions.map((style) => {
                    const active = draft.imageType === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => {
                          updateField("imageType", style);
                          updateAssetTheme(style);
                        }}
                        className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                          active
                            ? "border-sky-400/35 bg-sky-400/12 text-sky-100"
                            : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-sky-400/25 hover:bg-white/[0.07]"
                        }`}
                      >
                        {bannerImageTypeLabels[style]}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={generateBanner}
                  className="rounded-[22px] border border-sky-400/25 bg-sky-400/12 px-4 py-3 text-left transition hover:bg-sky-400/18"
                >
                  <p className="text-sm font-semibold text-sky-200">Generate {bannerStyleLabel} banner</p>
                  <p className="mt-1 text-xs leading-5 text-sky-100/75">
                    Assemble the current banner composition from image, font, and title.
                  </p>
                </button>
              </div>
            </ControlCard>

            <ControlCard
              title="Colors and type"
              description="This matches the editor's pattern: direct color picking with structured layout controls."
            >
              <div className="grid gap-5">
                <div className="grid gap-4">
                  <ColorField label="Background" value={draft.backgroundColor} onChange={(value) => updateField("backgroundColor", value)} />
                  <ColorField label="Accent" value={draft.accentColor} onChange={(value) => updateField("accentColor", value)} />
                  <ColorField label="Text" value={draft.textColor} onChange={(value) => updateField("textColor", value)} />
                </div>

                <div className="grid gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">Font</span>
                    <select
                      value={draft.fontChoice}
                      onChange={(event) => updateField("fontChoice", event.target.value as BannerFontChoice)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-sky-400"
                    >
                      {Object.entries(bannerFontLabels).map(([value, label]) => (
                        <option key={value} value={value} className="bg-slate-950 text-white">
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                </div>

              </div>
            </ControlCard>
          </aside>

          <section
            ref={previewAreaRef}
            className="relative z-10 flex min-h-0 items-center overflow-hidden rounded-[34px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur"
          >
            <div
              ref={previewRef}
              className={`relative mx-auto max-h-full overflow-hidden border border-white/10 ${bannerAspectClassName[draft.size]}`}
              style={{
                width: previewFitWidth ? `${previewFitWidth}px` : "100%",
                aspectRatio: String(bannerAspectRatio[draft.size]),
                backgroundColor: draft.backgroundColor,
                color: draft.textColor,
                fontFamily: previewFontFamily,
                transform: draft.titleImageSwap ? "scaleX(-1)" : undefined,
                transformOrigin: "center",
              }}
            >
              <BannerTemplatePreview
                layout={activeStylePreset.layout}
                draft={draft}
                selectedBannerImage={selectedBannerImage}
                titleFontSizePx={titleFontSizePx}
                onTitleChange={(value) => updateField("title", value)}
                onTitleAlignmentChange={(alignment) => updateField("titleAlignment", alignment)}
                onTitleMirrorChange={(value) => updateField("titleImageSwap", value)}
              />
            </div>
          </section>
        </div>
      </div>
      </main>
      <BannerStylesModal
        isOpen={isStylePopupOpen}
        activePresetId={activeStylePresetId}
        onClose={() => setIsStylePopupOpen(false)}
        onApplyPreset={applyStylePreset}
      />
    </>
  );
}
