import type { BannerFontChoice, BannerImageType } from "@/lib/bannerDefinitions";

export type BannerStylePresetId =
  | "aurora-burst"
  | "sunrise-editorial"
  | "midnight-luxe"
  | "clean-poster"
  | "fresh-gradient"
  | "mono-stage"
  | "frame-strip"
  | "circle-badge"
  | "brutal-grid"
  | "slab-cut"
  | "glass-label"
  | "poster-burst";

export type BannerStyleLayoutId =
  | "aurora"
  | "editorial"
  | "luxe"
  | "poster"
  | "gradient"
  | "mono"
  | "frame-strip"
  | "circle-badge"
  | "brutal-grid"
  | "slab-cut"
  | "glass-label"
  | "poster-burst";

export type BannerStylePreset = {
  id: BannerStylePresetId;
  layout: BannerStyleLayoutId;
  label: string;
  description: string;
  previewTag: string;
  previewTitle: string;
  previewSubtitle: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontChoice: BannerFontChoice;
  imageType: BannerImageType;
  titleScale: number;
  positionIndex: number;
  assetVariantIndex: number;
};

export const bannerStylePresets: BannerStylePreset[] = [
  {
    id: "aurora-burst",
    layout: "aurora",
    label: "Aurora Burst",
    description: "Bright neon glow with a compact centered headline.",
    previewTag: "launch",
    previewTitle: "Aurora Burst",
    previewSubtitle: "Electric, energetic, high-contrast.",
    backgroundColor: "#08111f",
    accentColor: "#7dd3fc",
    textColor: "#f8fafc",
    fontChoice: "syne",
    imageType: "code",
    titleScale: 100,
    positionIndex: 0,
    assetVariantIndex: 0,
  },
  {
    id: "sunrise-editorial",
    layout: "editorial",
    label: "Sunrise Editorial",
    description: "Warm magazine feel with elegant serif type.",
    previewTag: "story",
    previewTitle: "Sunrise Editorial",
    previewSubtitle: "Soft, refined, and text-first.",
    backgroundColor: "#f3ebe0",
    accentColor: "#c65a2d",
    textColor: "#1b1714",
    fontChoice: "playfair",
    imageType: "travel",
    titleScale: 92,
    positionIndex: 1,
    assetVariantIndex: 1,
  },
  {
    id: "midnight-luxe",
    layout: "luxe",
    label: "Midnight Luxe",
    description: "Dark premium card with gold contrast and strong hierarchy.",
    previewTag: "premium",
    previewTitle: "Midnight Luxe",
    previewSubtitle: "Polished, dramatic, and luxurious.",
    backgroundColor: "#050816",
    accentColor: "#f5c542",
    textColor: "#fff7d1",
    fontChoice: "oswald",
    imageType: "business",
    titleScale: 96,
    positionIndex: 2,
    assetVariantIndex: 2,
  },
  {
    id: "clean-poster",
    layout: "poster",
    label: "Clean Poster",
    description: "Minimal layout with strong black text and simple geometry.",
    previewTag: "poster",
    previewTitle: "Clean Poster",
    previewSubtitle: "Minimal, sharp, and printable.",
    backgroundColor: "#f8f7f2",
    accentColor: "#141414",
    textColor: "#111111",
    fontChoice: "inter",
    imageType: "business",
    titleScale: 88,
    positionIndex: 0,
    assetVariantIndex: 3,
  },
  {
    id: "fresh-gradient",
    layout: "gradient",
    label: "Fresh Gradient",
    description: "Lively blue-green glow with rounded friendly text.",
    previewTag: "earth",
    previewTitle: "Fresh Gradient",
    previewSubtitle: "Clean energy and friendly movement.",
    backgroundColor: "#0b4ef0",
    accentColor: "#34d399",
    textColor: "#eefdf5",
    fontChoice: "space",
    imageType: "code",
    titleScale: 98,
    positionIndex: 1,
    assetVariantIndex: 4,
  },
  {
    id: "mono-stage",
    layout: "mono",
    label: "Mono Stage",
    description: "Bold monochrome layout with oversized heading.",
    previewTag: "stage",
    previewTitle: "Mono Stage",
    previewSubtitle: "Simple, striking, and easy to read.",
    backgroundColor: "#0b0b0d",
    accentColor: "#ededed",
    textColor: "#f5f5f5",
    fontChoice: "merriweather",
    imageType: "ai",
    titleScale: 104,
    positionIndex: 2,
    assetVariantIndex: 0,
  },
  {
    id: "frame-strip",
    layout: "frame-strip",
    label: "Frame Strip",
    description: "Split layout with a wide image slab and a clean title block.",
    previewTag: "strip",
    previewTitle: "Frame Strip",
    previewSubtitle: "Rectangular, editorial, and direct.",
    backgroundColor: "#0f172a",
    accentColor: "#38bdf8",
    textColor: "#f8fafc",
    fontChoice: "jakarta",
    imageType: "business",
    titleScale: 96,
    positionIndex: 1,
    assetVariantIndex: 0,
  },
  {
    id: "circle-badge",
    layout: "circle-badge",
    label: "Circle Badge",
    description: "Round image badge with floating text and soft contrast.",
    previewTag: "orb",
    previewTitle: "Circle Badge",
    previewSubtitle: "Rounded, airy, and playful.",
    backgroundColor: "#111827",
    accentColor: "#f472b6",
    textColor: "#fff1f5",
    fontChoice: "syne",
    imageType: "travel",
    titleScale: 90,
    positionIndex: 2,
    assetVariantIndex: 1,
  },
  {
    id: "brutal-grid",
    layout: "brutal-grid",
    label: "Brutal Grid",
    description: "Hard edges, strict blocks, and raw contrast.",
    previewTag: "grid",
    previewTitle: "Brutal Grid",
    previewSubtitle: "Sharp, loud, and rigid.",
    backgroundColor: "#050505",
    accentColor: "#f97316",
    textColor: "#ffffff",
    fontChoice: "oswald",
    imageType: "ai",
    titleScale: 104,
    positionIndex: 0,
    assetVariantIndex: 2,
  },
  {
    id: "slab-cut",
    layout: "slab-cut",
    label: "Slab Cut",
    description: "Diagonal cut with a heavy headline slab.",
    previewTag: "cut",
    previewTitle: "Slab Cut",
    previewSubtitle: "Fast, sharp, and graphic.",
    backgroundColor: "#f8fafc",
    accentColor: "#111827",
    textColor: "#0f172a",
    fontChoice: "inter",
    imageType: "code",
    titleScale: 94,
    positionIndex: 1,
    assetVariantIndex: 3,
  },
  {
    id: "glass-label",
    layout: "glass-label",
    label: "Glass Label",
    description: "Transparent stacked labels with soft glass panels.",
    previewTag: "glass",
    previewTitle: "Glass Label",
    previewSubtitle: "Light, layered, and translucent.",
    backgroundColor: "#0b1220",
    accentColor: "#c084fc",
    textColor: "#f5f3ff",
    fontChoice: "space",
    imageType: "code",
    titleScale: 98,
    positionIndex: 2,
    assetVariantIndex: 4,
  },
  {
    id: "poster-burst",
    layout: "poster-burst",
    label: "Poster Burst",
    description: "Big poster headline with a bold image corner.",
    previewTag: "burst",
    previewTitle: "Poster Burst",
    previewSubtitle: "Contrasty, punchy, and direct.",
    backgroundColor: "#fffaf2",
    accentColor: "#dc2626",
    textColor: "#111111",
    fontChoice: "merriweather",
    imageType: "business",
    titleScale: 100,
    positionIndex: 0,
    assetVariantIndex: 0,
  },
];

export function getBannerStylePreset(id: BannerStylePresetId) {
  return bannerStylePresets.find((preset) => preset.id === id) ?? bannerStylePresets[0];
}
