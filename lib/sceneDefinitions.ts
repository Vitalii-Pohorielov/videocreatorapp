import { getFeatureAnimatedIcons } from "@/lib/animatedFeatureIcons";

import { getDefaultTransition } from "@/lib/sceneTransitions";

export type TransitionType = "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "zoom-in" | "zoom-out";

export type TemplatePreset =
  | "white"
  | "black"
  | "premium"
  | "bold"
  | "editorial"
  | "sunset"
  | "mono"
  | "neon-grid"
  | "paper-cut"
  | "arctic-glass"
  | "brutalist"
  | "velvet-noir"
  | "mint-pop"
  | "terminal"
  | "blueprint"
  | "chrome-sport"
  | "solar-archive"
  | "acid-pop"
  | "retro-print"
  | "ember-glow";

const templatePresets = [
  "white",
  "black",
  "premium",
  "bold",
  "editorial",
  "sunset",
  "mono",
  "neon-grid",
  "paper-cut",
  "arctic-glass",
  "brutalist",
  "velvet-noir",
  "mint-pop",
  "terminal",
  "blueprint",
  "chrome-sport",
  "solar-archive",
  "acid-pop",
  "retro-print",
  "ember-glow",
] as const satisfies readonly TemplatePreset[];

export type ExportResolution = "480p" | "540p" | "720p";
export type ExportProfile = "draft" | "standard" | "high";
export type VideoType = "promo" | "announcement";

export type SceneType =
  | "announcement-hero"
  | "brand-reveal"
  | "brand-reveal-alt"
  | "brand-reveal-circle"
  | "product-showcase"
  | "feature-grid"
  | "code-preview"
  | "code-review"
  | "slogan"
  | "split-slogan"
  | "description"
  | "pricing"
  | "pricing-peek"
  | "process"
  | "center-text"
  | "website-url"
  | "website-scroll"
  | "website-scroll-overlay"
  | "website-scroll-front"
  | "quote"
  | "cta"
  | "cta-panel";

export type ExportSettings = {
  fps: number;
  transitionSeconds: number;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  preset: TemplatePreset;
  resolution: ExportResolution;
  profile: ExportProfile;
};

export type Scene = {
  id: string;
  type: SceneType;
  name: string;
  durationSeconds: number;
  transition: TransitionType;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  projectCount?: number;
  projectImageUrls?: string[];
  pricingPlanTitles?: string[];
  pricingPlanDescriptions?: string[];
  processStepDescriptions?: string[];
  bulletEmojis: string[];
  bulletImageUrls: string[];
  websiteImageUrl: string;
  logoImageUrl: string;
  authorImageUrl: string;
  mediaPosition: "left" | "right" | "bottom";
  code?: string;
};

export type SceneTrack = {
  id: "main-track";
  name: string;
  scenes: Scene[];
};

export const freePromoSceneTypes: SceneType[] = ["brand-reveal", "product-showcase", "feature-grid"];
export const freeStylePresets: TemplatePreset[] = ["black", "white"];

export const videoTypeLabels: Record<VideoType, string> = {
  promo: "Promo video",
  announcement: "Announcement video",
};

type SceneTemplate = Omit<Scene, "id" | "name">;

type SceneDefinition = {
  type: SceneType;
  label: string;
  catalogDescription: string;
  createTemplate: () => SceneTemplate;
};

export const presetLabels: Record<TemplatePreset, string> = {
  white: "White",
  black: "Black",
  premium: "Premium",
  bold: "Bold",
  editorial: "Editorial",
  sunset: "Sunset",
  mono: "Mono",
  "neon-grid": "Neon Grid",
  "paper-cut": "Paper Cut",
  "arctic-glass": "Arctic Glass",
  brutalist: "Brutalist",
  "velvet-noir": "Velvet Noir",
  "mint-pop": "Mint Pop",
  terminal: "Terminal",
  blueprint: "Blueprint",
  "chrome-sport": "Chrome Sport",
  "solar-archive": "Signal Mesh",
  "acid-pop": "Acid Pop",
  "retro-print": "Retro Print",
  "ember-glow": "Ember Glow",
};

export const presetDefaults: Record<TemplatePreset, Pick<ExportSettings, "backgroundColor" | "textColor" | "accentColor">> = {
  white: { backgroundColor: "#ffffff", textColor: "#111111", accentColor: "#4b5563" },
  black: { backgroundColor: "#111111", textColor: "#ffffff", accentColor: "#cbd5e1" },
  premium: { backgroundColor: "#10233a", textColor: "#f8f3ea", accentColor: "#b89d74" },
  bold: { backgroundColor: "#13111c", textColor: "#ffd166", accentColor: "#e7b84f" },
  editorial: { backgroundColor: "#efe8de", textColor: "#181411", accentColor: "#826644" },
  sunset: { backgroundColor: "#1f0f0c", textColor: "#ffd9b3", accentColor: "#dd7d31" },
  mono: { backgroundColor: "#111111", textColor: "#f1f1f1", accentColor: "#cfcfcf" },
  "neon-grid": { backgroundColor: "#08111f", textColor: "#86f7ff", accentColor: "#27c9d4" },
  "paper-cut": { backgroundColor: "#f3eadf", textColor: "#2d1f18", accentColor: "#b9492b" },
  "arctic-glass": { backgroundColor: "#dff5ff", textColor: "#0d2236", accentColor: "#1067d6" },
  brutalist: { backgroundColor: "#f4f000", textColor: "#121212", accentColor: "#4a4a4a" },
  "velvet-noir": { backgroundColor: "#16070f", textColor: "#f7d6e6", accentColor: "#d86492" },
  "mint-pop": { backgroundColor: "#d9fff2", textColor: "#053b34", accentColor: "#14a789" },
  terminal: { backgroundColor: "#07130c", textColor: "#7dff9b", accentColor: "#24cc5b" },
  blueprint: { backgroundColor: "#0f2747", textColor: "#d8eeff", accentColor: "#5fb7e4" },
  "chrome-sport": { backgroundColor: "#0b0d12", textColor: "#f4f7fb", accentColor: "#d8ff3e" },
  "solar-archive": { backgroundColor: "#06131f", textColor: "#eef6ff", accentColor: "#ff6b2c" },
  "acid-pop": { backgroundColor: "#d6ff3f", textColor: "#161616", accentColor: "#d93fb8" },
  "retro-print": { backgroundColor: "#f6dfc8", textColor: "#3e2418", accentColor: "#aa5a31" },
  "ember-glow": { backgroundColor: "#1b0a07", textColor: "#ffd9bf", accentColor: "#d97440" },
};

export function normalizeTemplatePreset(preset: string | undefined | null): TemplatePreset {
  if (preset === "clean") return "white";
  if (preset && (templatePresets as readonly string[]).includes(preset)) return preset as TemplatePreset;
  return "white";
}

export const exportResolutionLabels: Record<ExportResolution, string> = {
  "480p": "480p",
  "540p": "540p",
  "720p": "720p",
};

export const exportProfileLabels: Record<ExportProfile, string> = {
  draft: "Draft",
  standard: "Standard",
  high: "High",
};

export const exportResolutionDimensions: Record<ExportResolution, { width: number; height: number }> = {
  "480p": { width: 854, height: 480 },
  "540p": { width: 960, height: 540 },
  "720p": { width: 1280, height: 720 },
};

export const sceneDefinitions: SceneDefinition[] = [
  {
    type: "announcement-hero",
    label: "Announcement Hero",
    catalogDescription: "Centered announcement title over a wall of uploaded project logos.",
    createTemplate: () => ({
      type: "announcement-hero",
      durationSeconds: 3.2,
      transition: getDefaultTransition(0, "announcement-hero"),
      eyebrow: "This week on",
      title: "DevHunt",
      subtitle: "",
      description: "",
      bullets: [],
      projectCount: 8,
      projectImageUrls: Array.from({ length: 8 }, () => ""),
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "brand-reveal",
    label: "Intro Fade",
    catalogDescription: "Hero intro scene.",
    createTemplate: () => ({
      type: "brand-reveal",
      durationSeconds: 2.7,
      transition: getDefaultTransition(1, "brand-reveal"),
      eyebrow: "Intro",
      title: "Your product",
      subtitle: "Add a short positioning line",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
      code: `function animateCode(progress) {
  const frames = 60;
  const step = Math.floor(progress * frames);

  for (let i = 0; i < step; i++) {
    renderFrame(i);
  }

  return "Animation complete!";
}`,
    }),
  },
  {
    type: "brand-reveal-alt",
    label: "Intro Click",
    catalogDescription: "Split intro with copy on one side and logo on the other.",
    createTemplate: () => ({
      type: "brand-reveal-alt",
      durationSeconds: 3,
      transition: getDefaultTransition(2, "brand-reveal-alt"),
      eyebrow: "",
      title: "Your product",
      subtitle: "",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "brand-reveal-circle",
    label: "Intro Circle",
    catalogDescription: "Accent circle reveal with title entering and fading out.",
    createTemplate: () => ({
      type: "brand-reveal-circle",
      durationSeconds: 3.2,
      transition: getDefaultTransition(3, "brand-reveal-circle"),
      eyebrow: "Intro",
      title: "Your product",
      subtitle: "",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "product-showcase",
    label: "Highlight",
    catalogDescription: "Text plus uploaded product screenshot.",
    createTemplate: () => ({
      type: "product-showcase",
      durationSeconds: 2.7,
      transition: getDefaultTransition(2, "product-showcase"),
      eyebrow: "Highlight",
      title: "Your product, clearly explained",
      subtitle: "Use this scene for the main value proposition",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "feature-grid",
    label: "Features",
    catalogDescription: "Grid of feature cards.",
    createTemplate: () => ({
      type: "feature-grid",
      durationSeconds: 2.7,
      transition: getDefaultTransition(3, "feature-grid"),
      eyebrow: "Features",
      title: "Why teams choose it",
      subtitle: "",
      description: "",
      bullets: ["Fast setup", "Clear workflow", "Export in browser"],
      bulletEmojis: ["", "", ""],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "code-preview",
    label: "Code Preview",
    catalogDescription: "Stylized code card with animated progress line.",
    createTemplate: () => ({
      type: "code-preview",
      durationSeconds: 2.7,
      transition: getDefaultTransition(4, "code-preview"),
      eyebrow: "Code",
      title: "",
      subtitle: "",
      description: `function animateCode(progress) {
  const frames = 60;
  const step = Math.floor(progress * frames);

  for (let i = 0; i < step; i++) {
    renderFrame(i);
  }

  return "Animation complete!";
}`,
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "code-review",
    label: "Code Review",
    catalogDescription: "Code window with explanatory review notes beside it.",
    createTemplate: () => ({
      type: "code-review",
      durationSeconds: 3.2,
      transition: getDefaultTransition(17, "code-review"),
      eyebrow: "Code review",
      title: "Readable structure",
      subtitle: "Explain the implementation beside the snippet",
      description: "Pair the code with a short review summary, rollout note, or implementation rationale.",
      code: `export async function reviewPullRequest(diff) {
  const findings = analyzeDiff(diff);

  return findings.filter((item) => item.severity !== "low");
}`,
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "left",
    }),
  },
  {
    type: "slogan",
    label: "Slogan",
    catalogDescription: "Big bold message.",
    createTemplate: () => ({
      type: "slogan",
      durationSeconds: 2.7,
      transition: getDefaultTransition(5, "slogan"),
      eyebrow: "Message",
      title: "Built to move fast.",
      subtitle: "",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "split-slogan",
    label: "Split Slogan",
    catalogDescription: "A slogan that exits in one phrase and reveals the second phrase after it.",
    createTemplate: () => ({
      type: "split-slogan",
      durationSeconds: 7,
      transition: getDefaultTransition(6, "split-slogan"),
      eyebrow: "Message",
      title: "On-demand security assessments for web applications",
      subtitle: "VaultScan",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "description",
    label: "Description",
    catalogDescription: "Three-line oversized text scene.",
    createTemplate: () => ({
      type: "description",
      durationSeconds: 2.7,
      transition: getDefaultTransition(7, "description"),
      eyebrow: "Details",
      title: "Real-world",
      subtitle: "design inspiration",
      description: "& UX patterns",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "pricing",
    label: "Pricing",
    catalogDescription: "Three-plan pricing layout with a clear featured option.",
    createTemplate: () => ({
      type: "pricing",
      durationSeconds: 2.7,
      transition: getDefaultTransition(8, "pricing"),
      eyebrow: "Pricing",
      title: "Pick a plan",
      subtitle: "Simple tiers that feel easy to compare.",
      description: "",
      bullets: ["Starter - $19", "Pro - $49", "Team - $99"],
      pricingPlanTitles: ["Starter", "Pro", "Team"],
      pricingPlanDescriptions: [
        "Great for small launches and demos.",
        "Best balance of speed and polish.",
        "Everything a growing team needs.",
      ],
      bulletEmojis: ["", "", ""],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "pricing-peek",
    label: "Pricing Peek",
    catalogDescription: "Three tall pricing cards peeking from the screen edges with the middle plan elevated.",
    createTemplate: () => ({
      type: "pricing-peek",
      durationSeconds: 3.2,
      transition: getDefaultTransition(16, "pricing-peek"),
      eyebrow: "Pricing",
      title: "Choose the plan that fits",
      subtitle: "Side plans peek from the edges while the featured plan stands taller in the center.",
      description: "",
      bullets: ["$19", "$49", "$99"],
      pricingPlanTitles: ["Starter", "Pro", "Team"],
      pricingPlanDescriptions: [
        "Launch quickly with the essentials.",
        "Most popular for polished weekly content.",
        "Full flexibility for growing teams.",
      ],
      bulletEmojis: ["", "", ""],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "process",
    label: "Process",
    catalogDescription: "Three-step workflow or onboarding flow.",
    createTemplate: () => ({
      type: "process",
      durationSeconds: 2.7,
      transition: getDefaultTransition(9, "process"),
      eyebrow: "Process",
      title: "How it works",
      subtitle: "Three simple steps from idea to export.",
      description: "",
      bullets: ["Plan", "Create", "Export"],
      processStepDescriptions: ["Set the direction.", "Build the core scene.", "Export and share."],
      bulletEmojis: ["", "", ""],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "center-text",
    label: "Center Text",
    catalogDescription: "Centered copy with animated atmospheric background.",
    createTemplate: () => ({
      type: "center-text",
      durationSeconds: 2.7,
      transition: getDefaultTransition(10, "center-text"),
      eyebrow: "",
      title: "Bring the message to the center",
      subtitle: "",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "website-url",
    label: "URL",
    catalogDescription: "Large domain text with click-and-launch motion.",
    createTemplate: () => ({
      type: "website-url",
      durationSeconds: 2.7,
      transition: getDefaultTransition(11, "website-url"),
      eyebrow: "Website",
      title: "screensdesign.com",
      subtitle: "",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "website-scroll",
    label: "Website Scroll",
    catalogDescription: "Scroll a manually uploaded website screenshot.",
    createTemplate: () => ({
      type: "website-scroll",
      durationSeconds: 4,
      transition: getDefaultTransition(12, "website-scroll"),
      eyebrow: "Website",
      title: "Show the product page in motion",
      subtitle: "Upload a tall screenshot and the scene will auto-scroll it",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "website-scroll-overlay",
    label: "Website Scroll Overlay",
    catalogDescription: "Darkened website scroll in the background with oversized side copy in front.",
    createTemplate: () => ({
      type: "website-scroll-overlay",
      durationSeconds: 4,
      transition: getDefaultTransition(13, "website-scroll-overlay"),
      eyebrow: "Website",
      title: "A moving product story",
      subtitle: "Let the site scroll in the background",
      description: "While the key message stays large and readable in front.",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "left",
    }),
  },
  {
    type: "website-scroll-front",
    label: "Website Scroll Front",
    catalogDescription: "Scroll a manually uploaded website screenshot in a frontal frame.",
    createTemplate: () => ({
      type: "website-scroll-front",
      durationSeconds: 4,
      transition: getDefaultTransition(14, "website-scroll-front"),
      eyebrow: "Website",
      title: "Show the product page in motion",
      subtitle: "Upload a tall screenshot and the scene will auto-scroll it",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "quote",
    label: "Quote",
    catalogDescription: "Customer quote / testimonial.",
    createTemplate: () => ({
      type: "quote",
      durationSeconds: 2.7,
      transition: getDefaultTransition(14, "quote"),
      eyebrow: "Social proof",
      title: '"This changed our workflow overnight."',
      subtitle: "Team lead, Product Ops",
      description: "",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "cta",
    label: "CTA",
    catalogDescription: "Final call to action.",
    createTemplate: () => ({
      type: "cta",
      durationSeconds: 2.7,
      transition: getDefaultTransition(15, "cta"),
      eyebrow: "",
      title: "Launch your next promo today",
      subtitle: "Start with one scene and build the full story",
      description: "Get started",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "cta-panel",
    label: "CTA Panel",
    catalogDescription: "Panel-style call to action with a bold button block.",
    createTemplate: () => ({
      type: "cta-panel",
      durationSeconds: 3,
      transition: getDefaultTransition(16, "cta-panel"),
      eyebrow: "",
      title: "Start building in minutes",
      subtitle: "Pick a scene, tune the style, and export a polished promo without leaving the browser.",
      description: "Get started",
      bullets: [],
      bulletEmojis: [],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
];

export const sceneDefinitionMap: Record<SceneType, SceneDefinition> = sceneDefinitions.reduce(
  (acc, definition) => {
    acc[definition.type] = definition;
    return acc;
  },
  {} as Record<SceneType, SceneDefinition>,
);

export const sceneTypeLabels: Record<SceneType, string> = sceneDefinitions.reduce(
  (acc, definition) => {
    acc[definition.type] = definition.label;
    return acc;
  },
  {} as Record<SceneType, string>,
);

export function createScene(type: SceneType, index: number) {
  const definition = sceneDefinitionMap[type];
  const template = definition.createTemplate();
  const defaultFeatureIcons = type === "feature-grid" ? getFeatureAnimatedIcons(template.bullets.length) : [];

  return {
    id: crypto.randomUUID(),
    name: `${definition.label} ${index + 1}`,
    ...template,
    transition: getDefaultTransition(index, type),
    bulletEmojis: type === "feature-grid" ? defaultFeatureIcons.map((icon) => icon.fallbackEmoji) : template.bulletEmojis,
    bulletImageUrls: type === "feature-grid" ? defaultFeatureIcons.map((icon) => icon.imageUrl) : template.bulletImageUrls,
  } satisfies Scene;
}

export function createInitialSceneTrack(): SceneTrack {
  return createInitialSceneTrackForVideoType("promo");
}

export function createInitialSceneTrackForVideoType(videoType: VideoType): SceneTrack {
  const sceneTypes: SceneType[] =
    videoType === "announcement" ? ["announcement-hero"] : ["brand-reveal", "product-showcase", "feature-grid", "center-text", "cta"];

  return {
    id: "main-track",
    name: "Scene Track",
    scenes: sceneTypes.map((type, index) => createScene(type, index)),
  };
}

export function createFreeInitialSceneTrack(): SceneTrack {
  const starterSceneTypes = ["brand-reveal", "product-showcase", "feature-grid"] as const satisfies readonly SceneType[];
  return {
    id: "main-track",
    name: "Scene Track",
    scenes: starterSceneTypes.map((type, index) => createScene(type, index)),
  };
}

export function getDefaultProjectName(videoType: VideoType) {
  return videoType === "announcement" ? "Untitled announcement" : "Untitled project";
}
