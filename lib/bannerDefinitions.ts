export const bannerImageTypeLabels = {
  business: "Business",
  code: "Code",
  ai: "AI",
  travel: "Travel",
  lawyer: "Law",
  finance: "Finance",
  software: "Software",
} as const;

export type BannerImageType = keyof typeof bannerImageTypeLabels;

export const bannerFontLabels = {
  inter: "Inter",
  jakarta: "Plus Jakarta Sans",
  montserrat: "Montserrat",
  oswald: "Oswald",
  bebas: "Bebas Neue",
  playfair: "Playfair Display",
  merriweather: "Merriweather",
  space: "Space Grotesk",
  syne: "Syne",
} as const;

export type BannerFontChoice = keyof typeof bannerFontLabels;

export const bannerSizeLabels = {
  "1:1": "1:1",
  "4:3": "4:3",
  "16:9": "16:9",
} as const;

export type BannerSize = keyof typeof bannerSizeLabels;

export type BannerTitleAlignment = "left" | "center" | "right";
export type BannerTitlePlateStyle = "solid" | "blur";

export type BannerDraft = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontChoice: BannerFontChoice;
  titleScale: number;
  titleAlignment: BannerTitleAlignment;
  titleTextColor: string;
  titlePlateStyle: BannerTitlePlateStyle;
  titlePlateColor: string;
  titleImageSwap: boolean;
  titleOffset: {
    x: number;
    y: number;
  };
  imageOffset: {
    x: number;
    y: number;
  };
  imageWidthScale: number;
  imageHeightScale: number;
  decorOffset: {
    x: number;
    y: number;
  };
  imageType: BannerImageType;
  size: BannerSize;
};

export const defaultBannerDraft: BannerDraft = {
  eyebrow: "Fresh launch",
  title: "Build a banner that feels ready to ship",
  subtitle: "Tune messaging, colors, and art direction before we wire in the next generation steps.",
  cta: "Start now",
  backgroundColor: "#0f172a",
  accentColor: "#34d399",
  textColor: "#f8fafc",
  fontChoice: "space",
  titleScale: 100,
  titleAlignment: "center",
  titleTextColor: "#f8fafc",
  titlePlateStyle: "solid",
  titlePlateColor: "#111827",
  titleImageSwap: false,
  titleOffset: {
    x: 0,
    y: 0,
  },
  imageOffset: {
    x: 0,
    y: 0,
  },
  imageWidthScale: 100,
  imageHeightScale: 100,
  decorOffset: {
    x: 0,
    y: 0,
  },
  imageType: "code",
  size: "16:9",
};
