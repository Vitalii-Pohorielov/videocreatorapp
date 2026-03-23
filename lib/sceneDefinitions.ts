export type TransitionType = "fade";
export type TemplatePreset = "clean" | "premium" | "bold" | "editorial" | "sunset" | "mono" | "neon-grid" | "paper-cut" | "arctic-glass";
export type ExportResolution = "480p" | "540p" | "720p";
export type SceneType =
  | "brand-reveal"
  | "product-showcase"
  | "feature-grid"
  | "slogan"
  | "description"
  | "website-scroll"
  | "metrics"
  | "quote"
  | "checklist"
  | "cta";

export type ExportSettings = {
  fps: number;
  transitionSeconds: number;
  backgroundColor: string;
  textColor: string;
  preset: TemplatePreset;
  resolution: ExportResolution;
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
  bulletEmojis: string[];
  bulletImageUrls: string[];
  websiteImageUrl: string;
  logoImageUrl: string;
  authorImageUrl: string;
  mediaPosition: "left" | "right";
};

export type SceneTrack = {
  id: "main-track";
  name: string;
  scenes: Scene[];
};

type SceneTemplate = Omit<Scene, "id" | "name">;

type SceneDefinition = {
  type: SceneType;
  label: string;
  catalogDescription: string;
  createTemplate: () => SceneTemplate;
};

export const presetLabels: Record<TemplatePreset, string> = {
  clean: "Clean",
  premium: "Premium",
  bold: "Bold",
  editorial: "Editorial",
  sunset: "Sunset",
  mono: "Mono",
  "neon-grid": "Neon Grid",
  "paper-cut": "Paper Cut",
  "arctic-glass": "Arctic Glass",
};

export const presetDefaults: Record<TemplatePreset, Pick<ExportSettings, "backgroundColor" | "textColor">> = {
  clean: { backgroundColor: "#f7f4ee", textColor: "#1b1f23" },
  premium: { backgroundColor: "#10233a", textColor: "#f8f3ea" },
  bold: { backgroundColor: "#13111c", textColor: "#ffd166" },
  editorial: { backgroundColor: "#efe8de", textColor: "#181411" },
  sunset: { backgroundColor: "#1f0f0c", textColor: "#ffd9b3" },
  mono: { backgroundColor: "#111111", textColor: "#f1f1f1" },
  "neon-grid": { backgroundColor: "#08111f", textColor: "#86f7ff" },
  "paper-cut": { backgroundColor: "#f3eadf", textColor: "#2d1f18" },
  "arctic-glass": { backgroundColor: "#dff5ff", textColor: "#0d2236" },
};

export const exportResolutionLabels: Record<ExportResolution, string> = {
  "480p": "480p",
  "540p": "540p",
  "720p": "720p",
};

export const exportResolutionDimensions: Record<ExportResolution, { width: number; height: number }> = {
  "480p": { width: 854, height: 480 },
  "540p": { width: 960, height: 540 },
  "720p": { width: 1280, height: 720 },
};

export const sceneDefinitions: SceneDefinition[] = [
  {
    type: "brand-reveal",
    label: "Intro",
    catalogDescription: "Hero intro scene.",
    createTemplate: () => ({
      type: "brand-reveal",
      durationSeconds: 3.5,
      transition: "fade",
      eyebrow: "Intro",
      title: "Omnara",
      subtitle: "Command center for AI workflows",
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
      durationSeconds: 3.5,
      transition: "fade",
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
      durationSeconds: 3.5,
      transition: "fade",
      eyebrow: "Features",
      title: "Why teams choose it",
      subtitle: "",
      description: "",
      bullets: ["Fast setup", "Clear workflow", "Export in browser"],
      bulletEmojis: ["⚡", "🧭", "📦"],
      bulletImageUrls: [],
      websiteImageUrl: "",
      logoImageUrl: "",
      authorImageUrl: "",
      mediaPosition: "right",
    }),
  },
  {
    type: "slogan",
    label: "Slogan",
    catalogDescription: "Big bold message.",
    createTemplate: () => ({
      type: "slogan",
      durationSeconds: 3.5,
      transition: "fade",
      eyebrow: "Message",
      title: "Built to move fast.",
      subtitle: "Short, bold, memorable",
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
    catalogDescription: "Two-column description.",
    createTemplate: () => ({
      type: "description",
      durationSeconds: 3.5,
      transition: "fade",
      eyebrow: "Details",
      title: "What it does",
      subtitle: "",
      description: "Use this scene for a short paragraph describing the product.",
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
      durationSeconds: 3.5,
      transition: "fade",
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
    type: "metrics",
    label: "Metrics",
    catalogDescription: "Numbers and proof points.",
    createTemplate: () => ({
      type: "metrics",
      durationSeconds: 3.5,
      transition: "fade",
      eyebrow: "Results",
      title: "Numbers people remember",
      subtitle: "",
      description: "",
      bullets: ["3x faster", "42% more output", "5 min setup"],
      bulletEmojis: ["📈", "🚀", "⏱️"],
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
      durationSeconds: 3.5,
      transition: "fade",
      eyebrow: "Social proof",
      title: '"This changed our workflow overnight."',
      subtitle: "— Team lead, Product Ops",
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
    type: "checklist",
    label: "Checklist",
    catalogDescription: "Checklist or step list.",
    createTemplate: () => ({
      type: "checklist",
      durationSeconds: 3.5,
      transition: "fade",
      eyebrow: "What you get",
      title: "Everything in one workflow",
      subtitle: "",
      description: "",
      bullets: ["Capture", "Edit", "Export", "Share"],
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
      durationSeconds: 3.5,
      transition: "fade",
      eyebrow: "Call to action",
      title: "Launch your next promo today",
      subtitle: "Start with one scene and build the full story",
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

  return {
    id: crypto.randomUUID(),
    name: `${definition.label} ${index + 1}`,
    ...template,
  } satisfies Scene;
}

export function createInitialSceneTrack(): SceneTrack {
  const sceneTypes: SceneType[] = ["brand-reveal", "product-showcase", "feature-grid", "metrics", "cta"];

  return {
    id: "main-track",
    name: "Scene Track",
    scenes: sceneTypes.map((type, index) => createScene(type, index)),
  };
}
