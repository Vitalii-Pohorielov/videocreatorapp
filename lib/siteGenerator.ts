"use server";

import OpenAI from "openai";

import {
  createScene,
  normalizeTemplatePreset,
  presetDefaults,
  type ExportSettings,
  type Scene,
  type SceneTrack,
  type SceneType,
  type TemplatePreset,
} from "@/lib/sceneDefinitions";

type ScrapedSiteData = {
  sourceUrl: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  bullets: string[];
  cta: string[];
  metrics: string[];
  ogImageUrl: string;
};

type GeneratedProjectPayload = {
  projectName: string;
  sceneTrack: SceneTrack;
  exportSettings: ExportSettings;
};

type GeneratedSceneDraft = {
  type: SceneType;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  bullets?: string[];
  websiteImageUrl?: string;
  mediaPosition?: "left" | "right";
};

type GeneratedAiDraft = {
  projectName?: string;
  preset?: TemplatePreset | string;
  scenes?: GeneratedSceneDraft[];
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";
let openaiClient: OpenAI | null | undefined;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function uniqueNonEmpty(values: string[], maxItems = values.length) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= maxItems) break;
  }

  return result;
}

function matchAllText(html: string, regex: RegExp, maxItems = 20) {
  const values: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) && values.length < maxItems) {
    const text = stripTags(match[1] ?? "");
    if (text) values.push(text);
  }

  return uniqueNonEmpty(values, maxItems);
}

function findMetaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      const value = match?.[1] ? decodeHtml(match[1].trim()) : "";
      if (value) return value;
    }
  }

  return "";
}

function absolutizeUrl(value: string, sourceUrl: string) {
  if (!value) return "";
  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return "";
  }
}

function extractMetrics(text: string) {
  const matches = text.match(/\b\d+(?:\.\d+)?(?:[%xX]|ms|hrs?|hours?|days?|weeks?|months?|years?)\b/g) ?? [];
  return uniqueNonEmpty(matches, 3);
}

function getDomainLabel(sourceUrl: string) {
  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
    const [root] = hostname.split(".");
    return root ? root.charAt(0).toUpperCase() + root.slice(1) : "Website";
  } catch {
    return "Website";
  }
}

async function scrapeSite(url: string): Promise<ScrapedSiteData> {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not load website: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const cleanedHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const title = findMetaContent(cleanedHtml, ["og:title", "twitter:title"]) || stripTags(cleanedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description =
    findMetaContent(cleanedHtml, ["description", "og:description", "twitter:description"]) ||
    matchAllText(cleanedHtml, /<p[^>]*>([\s\S]*?)<\/p>/gi, 1)[0] ||
    "";
  const headings = uniqueNonEmpty(
    [
      ...matchAllText(cleanedHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, 4),
      ...matchAllText(cleanedHtml, /<h2[^>]*>([\s\S]*?)<\/h2>/gi, 8),
    ],
    8,
  );
  const paragraphs = matchAllText(cleanedHtml, /<p[^>]*>([\s\S]*?)<\/p>/gi, 12).filter((item) => item.length > 35);
  const bullets = matchAllText(cleanedHtml, /<li[^>]*>([\s\S]*?)<\/li>/gi, 10).filter((item) => item.length > 8);
  const allText = uniqueNonEmpty([...headings, ...paragraphs, ...bullets], 20).join(" ");
  const metrics = extractMetrics(allText);
  const cta = uniqueNonEmpty(
    [
      ...matchAllText(cleanedHtml, /<(?:a|button)[^>]*>([\s\S]*?)<\/(?:a|button)>/gi, 20),
      ...bullets.filter((item) => /start|get|book|try|demo|sign|launch|contact|join/i.test(item)),
    ],
    6,
  ).filter((item) => item.length < 60);
  const ogImageUrl = absolutizeUrl(findMetaContent(cleanedHtml, ["og:image", "twitter:image"]), url);

  return {
    sourceUrl: url,
    title,
    description,
    headings,
    paragraphs,
    bullets,
    cta,
    metrics,
    ogImageUrl,
  };
}

function applyScene(scene: Scene, updates: Partial<Omit<Scene, "id" | "type">>) {
  return { ...scene, ...updates };
}

function takeBullets(values: string[], maxItems = 3) {
  return uniqueNonEmpty(values.filter((item) => item.length <= 90), maxItems).slice(0, maxItems);
}

function getOpenAIClient() {
  if (openaiClient !== undefined) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  openaiClient = apiKey ? new OpenAI({ apiKey }) : null;
  return openaiClient;
}

function buildRuleBasedProject(scraped: ScrapedSiteData): GeneratedProjectPayload {
  const normalizedUrl = scraped.sourceUrl;
  const projectName = scraped.title || getDomainLabel(normalizedUrl);
  const heroTitle = scraped.headings[0] || scraped.title || projectName;
  const heroSubtitle = scraped.description || scraped.headings[1] || `Explore ${projectName}.`;
  const featureBullets = takeBullets(scraped.bullets.length ? scraped.bullets : scraped.headings.slice(1), 3);
  const metricBullets = takeBullets(scraped.metrics, 3);
  const ctaLine = scraped.cta[0] || `Visit ${projectName}`;
  const supportingParagraph = scraped.paragraphs[0] || scraped.description;

  const scenes: Scene[] = [];

  scenes.push(
    applyScene(createScene("brand-reveal", scenes.length), {
      name: "Intro 1",
      eyebrow: getDomainLabel(normalizedUrl),
      title: projectName,
      subtitle: heroSubtitle.slice(0, 110),
    }),
  );

  scenes.push(
    applyScene(createScene("product-showcase", scenes.length), {
      name: "Highlight 1",
      eyebrow: "Website",
      title: heroTitle.slice(0, 90),
      subtitle: heroSubtitle.slice(0, 120),
      websiteImageUrl: scraped.ogImageUrl,
    }),
  );

  if (featureBullets.length > 0) {
    scenes.push(
      applyScene(createScene("feature-grid", scenes.length), {
        name: "Features 1",
        eyebrow: "Highlights",
        title: `Why ${projectName} stands out`,
        bullets: featureBullets,
        bulletEmojis: featureBullets.map(() => ""),
        bulletImageUrls: featureBullets.map(() => ""),
      }),
    );
  }

  if (supportingParagraph) {
    scenes.push(
      applyScene(createScene("description", scenes.length), {
        name: "Description 1",
        eyebrow: "Overview",
        title: scraped.headings[1] || "What it does",
        description: supportingParagraph.slice(0, 220),
      }),
    );
  }

  if (metricBullets.length > 0) {
    scenes.push(
      applyScene(createScene("metrics", scenes.length), {
        name: "Metrics 1",
        eyebrow: "Proof",
        title: "Key numbers on the page",
        bullets: metricBullets,
        bulletEmojis: metricBullets.map(() => ""),
        bulletImageUrls: metricBullets.map(() => ""),
      }),
    );
  }

  scenes.push(
    applyScene(createScene("cta", scenes.length), {
      name: "CTA 1",
      eyebrow: "Next step",
      title: ctaLine.slice(0, 90),
      subtitle: normalizedUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    }),
  );

  const finalScenes = scenes.slice(0, 6);

  return {
    projectName,
    sceneTrack: {
      id: "main-track",
      name: "Scene Track",
      scenes: finalScenes,
    },
    exportSettings: {
      fps: 30,
      transitionSeconds: 0.8,
      backgroundColor: presetDefaults.white.backgroundColor,
      textColor: presetDefaults.white.textColor,
      preset: "white",
      resolution: "720p",
      profile: "standard",
    },
  };
}

function normalizeAiDraftScene(sceneDraft: GeneratedSceneDraft, index: number, scraped: ScrapedSiteData) {
  const scene = createScene(sceneDraft.type, index);
  const bullets = takeBullets(sceneDraft.bullets ?? [], 3);

  return applyScene(scene, {
    eyebrow: sceneDraft.eyebrow?.slice(0, 40) || scene.eyebrow,
    title: sceneDraft.title?.slice(0, 110) || scene.title,
    subtitle: sceneDraft.subtitle?.slice(0, 140) || scene.subtitle,
    description: sceneDraft.description?.slice(0, 240) || scene.description,
    bullets: bullets.length > 0 ? bullets : scene.bullets,
    bulletEmojis: bullets.length > 0 ? bullets.map(() => "") : scene.bulletEmojis,
    bulletImageUrls: bullets.length > 0 ? bullets.map(() => "") : scene.bulletImageUrls,
    websiteImageUrl: sceneDraft.websiteImageUrl || scraped.ogImageUrl || scene.websiteImageUrl,
    mediaPosition: sceneDraft.mediaPosition || scene.mediaPosition,
  });
}

function extractJsonObject(value: string) {
  const direct = value.trim();
  if (direct.startsWith("{") && direct.endsWith("}")) return direct;

  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start >= 0 && end > start) return value.slice(start, end + 1);
  return "";
}

async function generateProjectWithAi(scraped: ScrapedSiteData): Promise<GeneratedProjectPayload | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const prompt = [
    "You convert website scrape data into a short promo video storyboard.",
    "Return only valid JSON with this exact shape:",
    '{"projectName":"string","preset":"white|black|premium|bold|editorial|sunset|mono|neon-grid|paper-cut|arctic-glass|brutalist|velvet-noir|mint-pop|terminal|blueprint|acid-pop|retro-print|ember-glow","scenes":[{"type":"brand-reveal|product-showcase|feature-grid|slogan|description|website-scroll|metrics|quote|checklist|cta","eyebrow":"string","title":"string","subtitle":"string","description":"string","bullets":["string"],"mediaPosition":"left|right"}]}',
    "Rules:",
    "- Use 4 to 6 scenes.",
    "- Keep text concise and marketing-ready.",
    "- Prefer scenes: brand-reveal, product-showcase, feature-grid or description, metrics when numbers exist, and cta.",
    "- Only use website-scroll if an image or product-page angle makes sense.",
    "- No markdown, no explanations, JSON only.",
    `Website data: ${JSON.stringify(
      {
        sourceUrl: scraped.sourceUrl,
        title: scraped.title,
        description: scraped.description,
        headings: scraped.headings.slice(0, 6),
        paragraphs: scraped.paragraphs.slice(0, 4),
        bullets: scraped.bullets.slice(0, 8),
        cta: scraped.cta.slice(0, 4),
        metrics: scraped.metrics.slice(0, 4),
        ogImageUrl: scraped.ogImageUrl,
      },
      null,
      2,
    )}`,
  ].join("\n");

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    input: prompt,
  });

  const raw = response.output_text ?? "";
  const json = extractJsonObject(raw);
  if (!json) return null;

  const draft = JSON.parse(json) as GeneratedAiDraft;
  const sceneDrafts = (draft.scenes ?? []).filter((scene): scene is GeneratedSceneDraft => Boolean(scene?.type));
  if (sceneDrafts.length === 0) return null;

  const scenes = sceneDrafts.slice(0, 6).map((sceneDraft, index) => normalizeAiDraftScene(sceneDraft, index, scraped));
  const preset = normalizeTemplatePreset(draft.preset);

  return {
    projectName: (draft.projectName || scraped.title || getDomainLabel(scraped.sourceUrl)).slice(0, 80),
    sceneTrack: {
      id: "main-track",
      name: "Scene Track",
      scenes,
    },
    exportSettings: {
      fps: 30,
      transitionSeconds: 0.8,
      backgroundColor: presetDefaults[preset].backgroundColor,
      textColor: presetDefaults[preset].textColor,
      preset,
      resolution: "720p",
      profile: "standard",
    },
  };
}

export async function generateProjectFromUrl(inputUrl: string): Promise<GeneratedProjectPayload> {
  const url = inputUrl.trim();
  if (!url) throw new Error("Add a website URL first.");

  let normalizedUrl: string;
  try {
    normalizedUrl = new URL(url.startsWith("http") ? url : `https://${url}`).toString();
  } catch {
    throw new Error("Enter a valid website URL.");
  }

  const scraped = await scrapeSite(normalizedUrl);
  const aiProject = await generateProjectWithAi(scraped).catch(() => null);
  if (aiProject) return aiProject;
  return buildRuleBasedProject(scraped);
}
