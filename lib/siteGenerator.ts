"use server";

import { getFeatureAnimatedIcons } from "@/lib/animatedFeatureIcons";
import { createScene, presetDefaults, type ExportSettings, type Scene, type SceneTrack, type TemplatePreset } from "@/lib/sceneDefinitions";

type ScrapedSiteData = {
  sourceUrl: string;
  siteName: string;
  pageName: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  bullets: string[];
  featureCandidates: string[];
  cta: string[];
  ogImageUrl: string;
  logoImageUrl: string;
};

type GeneratedProjectPayload = {
  projectName: string;
  sceneTrack: SceneTrack;
  exportSettings: ExportSettings;
};

type ExtractedSiteBrief = {
  name: string;
  slogan: string[];
  description: string;
  price: string[];
  stepsToUse: string[];
  cta: string;
  features: string[];
};

type GeneratedScenePlan = {
  type: SupportedGeneratedSceneType;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  pricingPlanTitles?: string[];
  pricingPlanDescriptions?: string[];
  processStepDescriptions?: string[];
  mediaPosition?: "left" | "right" | "bottom";
};

type GeneratedProjectPlan = {
  projectName: string;
  preset: TemplatePreset;
  scenes: GeneratedScenePlan[];
};

type IntroSceneType = "brand-reveal" | "brand-reveal-alt" | "brand-reveal-circle";
type SupportedGeneratedSceneType =
  | IntroSceneType
  | "product-showcase"
  | "feature-grid"
  | "slogan"
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

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_GENERATED_SCENES = 6;
const introSceneTypes: IntroSceneType[] = ["brand-reveal", "brand-reveal-alt", "brand-reveal-circle"];
const supportedGeneratedSceneTypes: SupportedGeneratedSceneType[] = [
  "brand-reveal",
  "brand-reveal-alt",
  "brand-reveal-circle",
  "product-showcase",
  "feature-grid",
  "slogan",
  "description",
  "pricing",
  "pricing-peek",
  "process",
  "center-text",
  "website-url",
  "website-scroll",
  "website-scroll-overlay",
  "website-scroll-front",
  "quote",
  "cta",
  "cta-panel",
];
const sceneDisplayNames: Record<SupportedGeneratedSceneType, string> = {
  "brand-reveal": "Intro",
  "brand-reveal-alt": "Intro",
  "brand-reveal-circle": "Intro",
  "product-showcase": "Highlight",
  "feature-grid": "Features",
  slogan: "Slogan",
  description: "Description",
  pricing: "Pricing",
  "pricing-peek": "Pricing",
  process: "Process",
  "center-text": "Message",
  "website-url": "URL",
  "website-scroll": "Website",
  "website-scroll-overlay": "Website",
  "website-scroll-front": "Website",
  quote: "Quote",
  cta: "CTA",
  "cta-panel": "CTA",
};

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

function splitIntoPhrases(value: string) {
  return value
    .split(/[.!?;:\n\r|]+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
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

function findLinkHref(html: string, relPattern: RegExp) {
  const linkRegex = /<link\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html))) {
    const tag = match[0] ?? "";
    const relMatch = tag.match(/\brel=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
    const rel = relMatch?.[1] ?? "";
    const href = hrefMatch?.[1] ?? "";
    if (href && relPattern.test(rel)) return href;
  }

  return "";
}

function findLogoImageUrl(html: string, sourceUrl: string) {
  const imageTagRegex = /<img\b[^>]*>/gi;
  const candidates: Array<{ score: number; src: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = imageTagRegex.exec(html))) {
    const tag = match[0] ?? "";
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? "";
    if (!src) continue;

    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "";
    const className = tag.match(/\bclass=["']([^"']*)["']/i)?.[1] ?? "";
    const id = tag.match(/\bid=["']([^"']*)["']/i)?.[1] ?? "";
    const title = tag.match(/\btitle=["']([^"']*)["']/i)?.[1] ?? "";
    const ariaLabel = tag.match(/\baria-label=["']([^"']*)["']/i)?.[1] ?? "";
    const joined = [src, alt, className, id, title, ariaLabel].join(" ").toLowerCase();

    let score = 0;
    if (/logo/.test(joined)) score += 6;
    if (/brand|navbar-brand|site-logo|header-logo/.test(joined)) score += 4;
    if (/icon/.test(joined)) score += 1;
    if (/avatar|author|hero|banner|product|screenshot/.test(joined)) score -= 3;
    if (/\.(svg|png|webp|jpg|jpeg)(\?|$)/i.test(src)) score += 1;
    if (score > 0) candidates.push({ score, src });
  }

  const bestImageCandidate = candidates.sort((a, b) => b.score - a.score)[0]?.src ?? "";
  const iconCandidate =
    findLinkHref(html, /(?:^|\s)(?:apple-touch-icon|mask-icon|shortcut icon|icon)(?:\s|$)/i) ||
    findMetaContent(html, ["og:logo"]);

  return absolutizeUrl(bestImageCandidate || iconCandidate, sourceUrl);
}

function absolutizeUrl(value: string, sourceUrl: string) {
  if (!value) return "";
  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return "";
  }
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

function getUrlPathname(sourceUrl: string) {
  try {
    return new URL(sourceUrl).pathname || "/";
  } catch {
    return "/";
  }
}

function isSubpageUrl(sourceUrl: string) {
  const pathname = getUrlPathname(sourceUrl);
  return pathname !== "/" && pathname !== "";
}

function getPageSlugLabel(sourceUrl: string) {
  try {
    const pathname = new URL(sourceUrl).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? "";
    if (!lastSegment) return "";

    return lastSegment
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return "";
  }
}

function pickLikelySiteNameFromTitle(title: string, domainLabel: string) {
  const normalized = title.replace(/\s+/g, " ").trim();
  if (!normalized) return domainLabel;

  const segments = normalized
    .split(/\s[|\-–—:·]\s/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) return domainLabel;

  const domainLower = domainLabel.toLowerCase();
  const matchingSegment = segments.find((segment) => segment.toLowerCase().includes(domainLower));
  if (matchingSegment) return matchingSegment;

  const shortSegment = segments.find((segment) => segment.length <= 32 && segment.split(" ").length <= 4);
  return shortSegment || segments[0] || domainLabel;
}

function sanitizeProjectName(value: string, domainLabel: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return domainLabel;

  const cleaned = normalized
    .replace(/\b(home|official site|homepage|welcome)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^[|:,\-–—\s]+|[|:,\-–—\s]+$/g, "");

  if (!cleaned) return domainLabel;
  if (cleaned.length > 48) return pickLikelySiteNameFromTitle(cleaned, domainLabel);
  return cleaned;
}

function resolvePageName(url: string, siteName: string, title: string, headings: string[]) {
  const domainLabel = getDomainLabel(url);
  const slugLabel = getPageSlugLabel(url);
  const subpage = isSubpageUrl(url);
  const headingName = sanitizeProjectName(headings[0] || "", siteName || domainLabel);
  const titleName = sanitizeProjectName(title || "", siteName || domainLabel);
  const slugName = sanitizeProjectName(slugLabel || "", siteName || domainLabel);

  if (subpage) {
    const candidates = [headingName, titleName, slugName].filter(Boolean);
    const specificCandidate = candidates.find((candidate) => candidate.toLowerCase() !== (siteName || "").toLowerCase());
    return specificCandidate || candidates[0] || siteName || domainLabel;
  }

  return headingName || titleName || siteName || domainLabel;
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

  const domainLabel = getDomainLabel(url);
  const documentTitle = stripTags(cleanedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const metaTitle = findMetaContent(cleanedHtml, ["og:title", "twitter:title"]);
  const siteNameMeta = findMetaContent(cleanedHtml, ["og:site_name", "application-name", "apple-mobile-web-app-title"]);
  const siteName = sanitizeProjectName(siteNameMeta || pickLikelySiteNameFromTitle(documentTitle || metaTitle, domainLabel), domainLabel);
  const title = sanitizeProjectName(metaTitle || documentTitle || siteName, siteName);
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
  const featureCandidates = extractFeatureCandidates(headings, bullets, paragraphs);
  const cta = uniqueNonEmpty(
    [
      ...matchAllText(cleanedHtml, /<(?:a|button)[^>]*>([\s\S]*?)<\/(?:a|button)>/gi, 20),
      ...bullets.filter((item) => /start|get|book|try|demo|sign|launch|contact|join/i.test(item)),
    ],
    6,
  ).filter((item) => item.length < 60);
  const ogImageUrl = absolutizeUrl(findMetaContent(cleanedHtml, ["og:image", "twitter:image"]), url);
  const logoImageUrl = findLogoImageUrl(cleanedHtml, url);
  const pageName = resolvePageName(url, siteName, title, headings);

  return {
    sourceUrl: url,
    siteName,
    pageName,
    title,
    description,
    headings,
    paragraphs,
    bullets,
    featureCandidates,
    cta,
    ogImageUrl,
    logoImageUrl,
  };
}

function applyScene(scene: Scene, updates: Partial<Omit<Scene, "id" | "type">>) {
  return { ...scene, ...updates };
}

function takeBullets(values: string[], maxItems = 3) {
  return uniqueNonEmpty(values.filter((item) => item.length <= 90), maxItems).slice(0, maxItems);
}

function randomChoice<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)] as T;
}

const generatedPresets = Object.keys(presetDefaults) as TemplatePreset[];
const templatePresetEnum = generatedPresets.map((preset) => `"${preset}"`).join(" | ");

function toShortLine(value: string, fallback: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return (normalized || fallback).slice(0, maxLength);
}

function compactMarketingLine(value: string, maxLength = 32) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[,:;()]+/g, "")
    .trim()
    .slice(0, maxLength);
}

function dedupeTextOptions(values: string[], maxLength: number) {
  return uniqueNonEmpty(
    values
      .map((value) => value.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .map((value) => value.slice(0, maxLength)),
    values.length,
  );
}

function pickShortSloganLines(values: string[], fallback: string) {
  const phrases = uniqueNonEmpty(
    values.flatMap((value) => splitIntoPhrases(value)).map((value) => compactMarketingLine(value, 32)),
    12,
  ).filter((value) => {
    const words = value.split(/\s+/).filter(Boolean);
    return value.length >= 4 && value.length <= 32 && words.length >= 1 && words.length <= 5;
  });

  if (phrases.length >= 3) return phrases.slice(0, 3);

  const source = compactMarketingLine(values.find(Boolean) || fallback, 96);
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["Built for", "clear product", "stories"];

  const chunks: string[] = [];
  const targetWordsPerLine = Math.max(1, Math.ceil(words.length / 3));
  for (let index = 0; index < words.length && chunks.length < 3; index += targetWordsPerLine) {
    chunks.push(compactMarketingLine(words.slice(index, index + targetWordsPerLine).join(" "), 32));
  }

  while (chunks.length < 3) {
    chunks.push(compactMarketingLine(fallback, 32));
  }

  return chunks.slice(0, 3);
}

function shortenFeatureText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\-\u2022*]+\s*/, "")
    .replace(/[.]+$/g, "")
    .trim()
    .slice(0, 56);
}

function extractFeatureCandidates(headings: string[], bullets: string[], paragraphs: string[]) {
  const rawCandidates = uniqueNonEmpty(
    [
      ...bullets,
      ...headings.filter((item) => /feature|benefit|why|capabilit|everything|works|powerful|fast|simple|workflow|automation|insight|analytics|team|secure/i.test(item)),
      ...paragraphs.flatMap((item) => splitIntoPhrases(item)),
    ],
    24,
  );

  const scored = rawCandidates
    .map((value, index) => {
      const shortened = shortenFeatureText(value);
      const text = shortened.toLowerCase();
      let score = index < bullets.length ? 4 : 0;
      if (/feature|benefit|why|capabilit|automation|analytics|insight|workflow|secure|fast|simple|collaboration|team|export|integrat/i.test(text)) score += 3;
      if (text.split(/\s+/).length <= 8) score += 2;
      if (shortened.length >= 12 && shortened.length <= 56) score += 1;
      if (/contact|pricing|login|sign in|book demo|get started|learn more/.test(text)) score -= 3;
      return { text: shortened, score };
    })
    .filter((item) => item.text.length >= 8)
    .sort((a, b) => b.score - a.score);

  return uniqueNonEmpty(scored.map((item) => item.text), 6).slice(0, 6);
}

function withDuration(scene: Scene, durationSeconds = 2.7) {
  return { ...scene, durationSeconds };
}

function buildDeterministicSiteBrief(scraped: ScrapedSiteData, normalizedUrl: string): ExtractedSiteBrief {
  const pageSlugLabel = getPageSlugLabel(normalizedUrl);
  const prefersSubpage = isSubpageUrl(normalizedUrl);
  const projectName = prefersSubpage
    ? sanitizeProjectName(scraped.pageName || scraped.headings[0] || scraped.title || pageSlugLabel || scraped.siteName || getDomainLabel(normalizedUrl), scraped.siteName || getDomainLabel(normalizedUrl))
    : scraped.siteName || scraped.pageName || scraped.title || getDomainLabel(normalizedUrl);
  const heroTitle = scraped.pageName || scraped.headings[0] || scraped.title || pageSlugLabel || projectName;
  const heroSubtitle = scraped.description || scraped.headings[1] || `Explore ${projectName}.`;
  const supportingParagraph = scraped.paragraphs[0] || scraped.description;
  const sloganLines = pickShortSloganLines(
    [scraped.headings[1] || "", scraped.headings[2] || "", scraped.headings[3] || "", scraped.description, supportingParagraph, heroTitle],
    projectName,
  );
  const featureBullets = takeBullets(scraped.featureCandidates.length ? scraped.featureCandidates : scraped.bullets.length ? scraped.bullets : scraped.headings.slice(1), 3);
  const ctaLine = scraped.cta[0] || `Visit ${projectName}`;
  const priceLines = takeBullets(
    scraped.bullets.filter((item) => /\$|€|£|\/mo|\/month|free|pricing|plan|starter|pro|team/i.test(item)),
    3,
  );
  const processCandidates = takeBullets(
    [
      ...scraped.headings.filter((item) => /how|step|workflow|process|start|setup|launch|create|export|upload|publish|share|analy/i.test(item)),
      ...scraped.featureCandidates,
      ...scraped.cta,
      ...scraped.paragraphs.flatMap((item) => splitIntoPhrases(item)),
    ],
    6,
  );
  const processSteps =
    processCandidates.length >= 3
      ? processCandidates.slice(0, 3)
      : [`Add ${projectName}`, "Shape the message", "Publish the result"];

  return {
    name: projectName,
    slogan: [
      toShortLine(sloganLines[0] || scraped.headings[1] || heroTitle, "Built for modern teams", 32),
      toShortLine(sloganLines[1] || scraped.headings[2] || scraped.description || heroSubtitle, "Clear product communication", 32),
      toShortLine(sloganLines[2] || scraped.headings[3] || supportingParagraph || `Explore ${projectName}`, "Fast demos and exports", 32),
    ],
    description: toShortLine(scraped.description || supportingParagraph || heroSubtitle, `Explore ${projectName}.`, 180),
    price:
      priceLines.length > 0
        ? priceLines
        : ["Starter - Contact sales", "Pro - Custom pricing", "Team - Custom setup"],
    stepsToUse: processSteps,
    cta: ctaLine,
    features:
      featureBullets.length > 0
        ? featureBullets
        : ["Fast setup", "Clear workflow", "Polished output"],
  };
}

function buildDeterministicProjectPlanFromBrief(brief: ExtractedSiteBrief, scraped: ScrapedSiteData, normalizedUrl: string): GeneratedProjectPlan {
  const projectName = brief.name || scraped.pageName || scraped.siteName || scraped.title || getDomainLabel(normalizedUrl);
  const heroTitle = scraped.pageName || scraped.headings[0] || projectName;
  const heroSubtitle = brief.description || scraped.description || `Explore ${projectName}.`;
  const normalizedDomain = normalizedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const quoteSource = scraped.headings[1] || brief.cta || normalizedDomain;
  const pricingTitles = ["Starter", "Pro", "Team"];
  const pricingDescriptions = [
    toShortLine(brief.price[0] || "Launch quickly with the essentials.", "Launch quickly with the essentials.", 48),
    toShortLine(brief.price[1] || "Best balance of speed and polish.", "Best balance of speed and polish.", 48),
    toShortLine(brief.price[2] || "Built for growing teams.", "Built for growing teams.", 48),
  ];

  const scenes: GeneratedScenePlan[] = [
      {
        type: "brand-reveal",
        eyebrow: getDomainLabel(normalizedUrl),
        title: projectName,
        subtitle: heroSubtitle.slice(0, 110),
        description: "",
        bullets: [],
      },
      {
        type: "description",
        eyebrow: "Overview",
        title: toShortLine(brief.slogan[0] || projectName, "Built for modern teams", 32),
        subtitle: toShortLine(brief.slogan[1] || heroSubtitle, "Clear product communication", 32),
        description: toShortLine(brief.slogan[2] || heroTitle, "Fast demos and exports", 32),
        bullets: [],
      },
      {
        type: "product-showcase",
        eyebrow: "Highlight",
        title: toShortLine(scraped.headings[1] || brief.features[0] || `${projectName} in action`, `${projectName} in action`, 90),
        subtitle: toShortLine(scraped.paragraphs[0] || brief.description || heroSubtitle, brief.description || heroSubtitle, 120),
        description: "",
        bullets: [],
        mediaPosition: "right",
      },
      {
        type: "feature-grid",
        eyebrow: "Highlights",
        title: `Why ${projectName} stands out`,
        subtitle: "",
        description: "",
        bullets: takeBullets(brief.features, 3),
      },
      {
        type: "process",
        eyebrow: "Process",
        title: "How it works",
        subtitle: toShortLine(brief.description || "Three simple steps from idea to export.", "Three simple steps from idea to export.", 72),
        description: "",
        bullets: takeBullets(brief.stepsToUse, 3).length === 3 ? takeBullets(brief.stepsToUse, 3) : [`Add ${projectName}`, "Shape the message", "Publish the result"],
        processStepDescriptions: [
          toShortLine(brief.stepsToUse[0] || scraped.headings[0] || "See the core offer.", "See the core offer.", 48),
          toShortLine(brief.stepsToUse[1] || scraped.headings[1] || "Understand the value fast.", "Understand the value fast.", 48),
          toShortLine(brief.stepsToUse[2] || brief.cta || "Take the next step.", "Take the next step.", 48),
        ],
      },
      {
        type: "pricing-peek",
        eyebrow: "Plans",
        title: `Choose ${projectName}`,
        subtitle: "Clear options for different team sizes.",
        description: "",
        bullets: ["$19", "$49", "$99"],
        pricingPlanTitles: pricingTitles,
        pricingPlanDescriptions: pricingDescriptions,
      },
      {
        type: "quote",
        eyebrow: "Social proof",
        title: `"${toShortLine(brief.description || scraped.description || `Explore ${projectName}`, `Explore ${projectName}`, 72)}"`,
        subtitle: toShortLine(quoteSource, normalizedDomain, 56),
        description: "",
        bullets: [],
      },
      {
        type: "website-scroll-overlay",
        eyebrow: "Website",
        title: toShortLine(heroTitle, "See the product in motion", 64),
        subtitle: toShortLine(heroSubtitle, "Let the product story scroll in the background.", 72),
        description: toShortLine(brief.slogan[2] || brief.description, "Key copy stays readable in front.", 72),
        bullets: [],
        mediaPosition: "left",
      },
      {
        type: "cta-panel",
        eyebrow: "Next step",
        title: brief.cta.slice(0, 90),
        subtitle: normalizedDomain,
        description: "Get started",
        bullets: [],
      },
      {
        type: "website-url",
        eyebrow: "Website",
        title: normalizedDomain.toLowerCase(),
        subtitle: "",
        description: "",
        bullets: [],
      },
    ];

  return {
    projectName,
    preset: randomChoice(generatedPresets),
    scenes: scenes.slice(0, MAX_GENERATED_SCENES),
  };
}

function buildWebsiteSummary(scraped: ScrapedSiteData, normalizedUrl: string) {
  return {
    url: normalizedUrl,
    domainLabel: getDomainLabel(normalizedUrl),
    pathname: getUrlPathname(normalizedUrl),
    isSubpage: isSubpageUrl(normalizedUrl),
    pageSlugLabel: getPageSlugLabel(normalizedUrl),
    siteName: scraped.siteName,
    pageName: scraped.pageName,
    title: scraped.title,
    description: scraped.description,
    headings: scraped.headings.slice(0, 6),
    paragraphs: scraped.paragraphs.slice(0, 4),
    bullets: scraped.bullets.slice(0, 6),
    featureCandidates: scraped.featureCandidates.slice(0, 6),
    cta: scraped.cta.slice(0, 4),
    ogImageUrl: scraped.ogImageUrl,
    logoImageUrl: scraped.logoImageUrl,
  };
}

function normalizePlanValue(value: string | undefined, fallback: string, maxLength: number) {
  return toShortLine(value ?? "", fallback, maxLength);
}

function buildSceneTextAlternatives(
  sceneType: SupportedGeneratedSceneType,
  scenePlan: GeneratedScenePlan,
  scraped: ScrapedSiteData,
  projectName: string,
  normalizedDomain: string,
) {
  switch (sceneType) {
    case "description":
      return {
        title: dedupeTextOptions([scenePlan.title, scraped.headings[1] || "", projectName], 90),
        subtitle: dedupeTextOptions([scenePlan.subtitle, scraped.headings[2] || "", scraped.description || ""], 120),
        description: dedupeTextOptions([scenePlan.description, scraped.headings[3] || "", scraped.paragraphs[0] || ""], 120),
      };
    case "product-showcase":
      return {
        title: dedupeTextOptions([scenePlan.title, scraped.headings[1] || "", scraped.featureCandidates[0] || "", `${projectName} in action`], 90),
        subtitle: dedupeTextOptions([scenePlan.subtitle, scraped.paragraphs[0] || "", scraped.description || "", `Built around ${projectName}`], 120),
        description: dedupeTextOptions([scenePlan.description, scraped.featureCandidates[1] || ""], 120),
      };
    case "process":
      return {
        title: dedupeTextOptions([scenePlan.title, `How to use ${projectName}`, "How it works"], 90),
        subtitle: dedupeTextOptions([scenePlan.subtitle, scraped.description || "", `Three steps to use ${projectName}`], 120),
        description: dedupeTextOptions([scenePlan.description, briefEmptyString()], 120),
      };
    case "feature-grid":
      return {
        title: dedupeTextOptions([scenePlan.title, `Why ${projectName} stands out`, "Core features"], 90),
        subtitle: dedupeTextOptions([scenePlan.subtitle, scraped.description || ""], 120),
        description: dedupeTextOptions([scenePlan.description], 120),
      };
    case "cta":
    case "cta-panel":
      return {
        title: dedupeTextOptions([scenePlan.title, scenePlan.description || "", `Visit ${projectName}`], 90),
        subtitle: dedupeTextOptions([scenePlan.subtitle, normalizedDomain], 120),
        description: dedupeTextOptions([scenePlan.description, "Get started"], 120),
      };
    default:
      return {
        title: dedupeTextOptions([scenePlan.title, scraped.headings[0] || projectName], 90),
        subtitle: dedupeTextOptions([scenePlan.subtitle, scraped.description || ""], 120),
        description: dedupeTextOptions([scenePlan.description, scraped.paragraphs[0] || ""], 120),
      };
  }
}

function briefEmptyString() {
  return "";
}

function chooseUniqueText(options: string[], used: Set<string>, fallback: string) {
  for (const option of options) {
    const normalized = option.replace(/\s+/g, " ").trim().toLowerCase();
    if (!normalized) continue;
    if (!used.has(normalized)) {
      used.add(normalized);
      return option;
    }
  }

  const fallbackValue = fallback.replace(/\s+/g, " ").trim();
  if (fallbackValue) used.add(fallbackValue.toLowerCase());
  return fallback;
}

function buildProjectPayloadFromPlan(plan: GeneratedProjectPlan, scraped: ScrapedSiteData, normalizedUrl: string): GeneratedProjectPayload {
  const projectName = normalizePlanValue(plan.projectName, scraped.pageName || scraped.siteName || scraped.title || getDomainLabel(normalizedUrl), 80);
  const normalizedDomain = normalizedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const preset = generatedPresets.includes(plan.preset) ? plan.preset : "white";
  const presetColors = presetDefaults[preset];
  const scenes: Scene[] = [];
  const usedSceneText = new Set<string>();
  const fallbackFeatureBullets = takeBullets(scraped.bullets.length ? scraped.bullets : scraped.headings.slice(1), 3);
  const featureFallbackSource = scraped.featureCandidates.length ? scraped.featureCandidates : fallbackFeatureBullets;
  const fallbackPricingTitles = ["Starter", "Pro", "Team"];
  const fallbackPricingDescriptions = [
    toShortLine(scraped.bullets[0] || "Launch quickly with the essentials.", "Launch quickly with the essentials.", 48),
    toShortLine(scraped.bullets[1] || "Best balance of speed and polish.", "Best balance of speed and polish.", 48),
    toShortLine(scraped.bullets[2] || "Built for growing teams.", "Built for growing teams.", 48),
  ];
  const fallbackPlan = buildDeterministicProjectPlanFromBrief(buildDeterministicSiteBrief(scraped, normalizedUrl), scraped, normalizedUrl);
  const rawScenes = (plan.scenes.length > 0 ? plan.scenes : fallbackPlan.scenes).slice(0, MAX_GENERATED_SCENES);
  const normalizedScenePlans = introSceneTypes.includes(rawScenes[0]?.type as IntroSceneType)
    ? rawScenes
    : [fallbackPlan.scenes[0], ...rawScenes].slice(0, MAX_GENERATED_SCENES);

  normalizedScenePlans.forEach((scenePlan, index) => {
    const scene = createScene(scenePlan.type, scenes.length);
    const textAlternatives = buildSceneTextAlternatives(scenePlan.type, scenePlan, scraped, projectName, normalizedDomain);
    const baseUpdates: Partial<Omit<Scene, "id" | "type">> = {
      name: `${sceneDisplayNames[scenePlan.type]} ${index + 1}`,
      eyebrow: chooseUniqueText(
        dedupeTextOptions([scenePlan.eyebrow, scene.eyebrow, sceneDisplayNames[scenePlan.type]], 32),
        usedSceneText,
        normalizePlanValue(scenePlan.eyebrow, scene.eyebrow, 32),
      ),
      title: chooseUniqueText(
        textAlternatives.title,
        usedSceneText,
        normalizePlanValue(scenePlan.title, projectName, 90),
      ),
      subtitle: chooseUniqueText(
        textAlternatives.subtitle,
        usedSceneText,
        normalizePlanValue(scenePlan.subtitle, scene.subtitle || scraped.description || "", 120),
      ),
      description: chooseUniqueText(
        textAlternatives.description,
        usedSceneText,
        normalizePlanValue(scenePlan.description, scene.description || "", 120),
      ),
      mediaPosition: scenePlan.mediaPosition ?? scene.mediaPosition,
    };

    switch (scenePlan.type) {
      case "brand-reveal":
      case "brand-reveal-alt":
      case "brand-reveal-circle":
        scenes.push(
          withDuration(
            applyScene(scene, {
              ...baseUpdates,
              logoImageUrl: scraped.logoImageUrl,
            }),
            scene.durationSeconds,
          ),
        );
        break;
      case "slogan":
      case "description":
      case "center-text":
      case "website-url":
      case "quote":
      case "cta":
      case "cta-panel":
        scenes.push(withDuration(applyScene(scene, baseUpdates), scene.durationSeconds));
        break;
      case "product-showcase":
      case "website-scroll":
      case "website-scroll-overlay":
      case "website-scroll-front":
        scenes.push(
          withDuration(
            applyScene(scene, {
              ...baseUpdates,
              websiteImageUrl: scraped.ogImageUrl,
            }),
            scene.durationSeconds,
          ),
        );
        break;
      case "feature-grid": {
        const bullets = takeBullets(scenePlan.bullets, 3);
        const nextBullets = uniqueNonEmpty(bullets.length > 0 ? bullets : takeBullets(featureFallbackSource, 3), 3);
        const icons = getFeatureAnimatedIcons(Math.max(nextBullets.length, 1));
        scenes.push(
          withDuration(
            applyScene(scene, {
              ...baseUpdates,
              bullets: nextBullets,
              bulletEmojis: icons.slice(0, nextBullets.length).map((icon) => icon.fallbackEmoji),
              bulletImageUrls: icons.slice(0, nextBullets.length).map((icon) => icon.imageUrl),
            }),
            scene.durationSeconds,
          ),
        );
        break;
      }
      case "pricing":
      case "pricing-peek": {
        const planTitles = (scenePlan.pricingPlanTitles ?? []).map((item) => toShortLine(item, "", 24)).filter(Boolean).slice(0, 3);
        const planDescriptions = (scenePlan.pricingPlanDescriptions ?? []).map((item) => toShortLine(item, "", 56)).filter(Boolean).slice(0, 3);
        const bullets = takeBullets(scenePlan.bullets, 3);
        scenes.push(
          withDuration(
            applyScene(scene, {
              ...baseUpdates,
              bullets: bullets.length > 0 ? bullets : scene.type === "pricing-peek" ? ["$19", "$49", "$99"] : ["Starter - $19", "Pro - $49", "Team - $99"],
              pricingPlanTitles: planTitles.length === 3 ? planTitles : fallbackPricingTitles,
              pricingPlanDescriptions: planDescriptions.length === 3 ? planDescriptions : fallbackPricingDescriptions,
            }),
            scene.durationSeconds,
          ),
        );
        break;
      }
      case "process": {
        const bullets = uniqueNonEmpty(takeBullets(scenePlan.bullets, 3), 3);
        const descriptions = uniqueNonEmpty((scenePlan.processStepDescriptions ?? []).map((item) => toShortLine(item, "", 56)).filter(Boolean).slice(0, 3), 3);
        scenes.push(
          withDuration(
            applyScene(scene, {
              ...baseUpdates,
              bullets: bullets.length === 3 ? bullets : [`Add ${projectName}`, "Shape the message", "Publish the result"],
              processStepDescriptions:
                descriptions.length === 3
                  ? descriptions
                  : [
                      toShortLine(scraped.headings[0] || "See the core offer.", "See the core offer.", 56),
                      toShortLine(scraped.headings[1] || "Understand the value fast.", "Understand the value fast.", 56),
                      toShortLine(scraped.cta[0] || "Take the next step.", "Take the next step.", 56),
                    ],
            }),
            scene.durationSeconds,
          ),
        );
        break;
      }
    }
  });

  return {
    projectName,
    sceneTrack: {
      id: "main-track",
      name: "Scene Track",
      scenes,
    },
    exportSettings: {
      fps: 30,
      transitionSeconds: 0.4,
      backgroundColor: presetColors.backgroundColor,
      textColor: presetColors.textColor,
      accentColor: presetColors.accentColor,
      preset,
      resolution: "720p",
      profile: "standard",
    },
  };
}

async function readOpenAiJsonResponse<T>(response: Response, model: string, errorContext: string): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  const responseText =
    payload.output_text ||
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("")
      .trim() ||
    "";

  if (!responseText) {
    throw new Error(`OpenAI returned an empty ${errorContext} for model ${model}.`);
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`OpenAI returned invalid JSON for model ${model}.`);
  }
}

async function requestOpenAiScenePlan(scraped: ScrapedSiteData, normalizedUrl: string): Promise<GeneratedProjectPlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const websiteSummary = buildWebsiteSummary(scraped, normalizedUrl);

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "medium" },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You create short promo video scene plans directly from website summaries. Return JSON only. Write scene-specific copy for every scene instead of a shared brief. Ground each scene in the site summary when possible. If the site is missing information, infer conservatively from the product value proposition without inventing customers, testimonials, case studies, or unsupported claims. If the URL is a subpage, analyze that exact page and its specific entity, not the website homepage or brand in general. Every scene should move the story forward with distinct messaging.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Create a promo video scene plan from this website summary:\n${JSON.stringify(websiteSummary, null, 2)}\n\nRequirements:\n- Return 4 to 6 scenes\n- Scene 1 must be one of: ${introSceneTypes.join(", ")}\n- For the rest, you may use any of these scene types: ${supportedGeneratedSceneTypes.join(", ")}\n- Generate text directly for each scene: eyebrow, title, subtitle, description, bullets, and optional pricing/process fields\n- Each scene must have a different communication role such as intro, explanation, feature proof, workflow, offer, CTA, or visual website moment\n- Avoid repeating the same headline, subtitle, description, or bullet text across scenes\n- Intro scenes should identify the product or page-specific entity clearly\n- Description scenes should feel like a compact 3-line message, with each line usually under 32 characters when possible\n- Product-showcase scenes should focus on one concrete benefit or outcome\n- Feature-grid scenes should use 1 to 3 concise feature bullets, preferably grounded in featureCandidates or clear site benefits\n- Process scenes must include exactly 3 bullets and 3 processStepDescriptions that explain a clear user flow\n- Pricing scenes may use generic plan framing if the site does not expose exact pricing, but do not invent exact unsupported price amounts\n- CTA scenes should be action-oriented and distinct from intro copy\n- Website scenes should make sense visually and still include scene-specific text\n- If the URL is a subpage, focus on that page's tool/product/entity rather than the parent site in general\n- Prefer concise, motion-graphics-friendly copy throughout`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "website_video_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              projectName: { type: "string" },
              preset: { type: "string", enum: generatedPresets },
              scenes: {
                type: "array",
                minItems: 4,
                maxItems: 6,
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: supportedGeneratedSceneTypes },
                    eyebrow: { type: "string" },
                    title: { type: "string" },
                    subtitle: { type: "string" },
                    description: { type: "string" },
                    bullets: { type: "array", items: { type: "string" }, maxItems: 3 },
                    pricingPlanTitles: { type: "array", items: { type: "string" }, maxItems: 3 },
                    pricingPlanDescriptions: { type: "array", items: { type: "string" }, maxItems: 3 },
                    processStepDescriptions: { type: "array", items: { type: "string" }, maxItems: 3 },
                    mediaPosition: { type: "string", enum: ["left", "right", "bottom"] },
                  },
                  required: ["type", "eyebrow", "title", "subtitle", "description", "bullets"],
                  additionalProperties: false,
                },
              },
            },
            required: ["projectName", "preset", "scenes"],
            additionalProperties: false,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  const plan = await readOpenAiJsonResponse<Partial<GeneratedProjectPlan>>(response, model, "scene plan");
  if (
    !plan.projectName ||
    !plan.preset ||
    !plan.scenes ||
    !generatedPresets.includes(plan.preset) ||
    !Array.isArray(plan.scenes) ||
    plan.scenes.length === 0 ||
    !introSceneTypes.includes(plan.scenes[0]?.type as IntroSceneType) ||
    plan.scenes.some((scene) => !scene || !supportedGeneratedSceneTypes.includes(scene.type))
  ) {
    throw new Error(`OpenAI returned an incomplete scene plan. Allowed presets: ${templatePresetEnum}.`);
  }

  return plan as GeneratedProjectPlan;
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
  const fallbackBrief = buildDeterministicSiteBrief(scraped, normalizedUrl);
  const fallbackPlan = buildDeterministicProjectPlanFromBrief(fallbackBrief, scraped, normalizedUrl);

  if (!process.env.OPENAI_API_KEY) {
    return buildProjectPayloadFromPlan(fallbackPlan, scraped, normalizedUrl);
  }

  try {
    const aiPlan = await requestOpenAiScenePlan(scraped, normalizedUrl);
    return buildProjectPayloadFromPlan(aiPlan, scraped, normalizedUrl);
  } catch (error) {
    console.error("[generate-from-url] OpenAI enhancement failed, using deterministic fallback.", error);
    return buildProjectPayloadFromPlan(fallbackPlan, scraped, normalizedUrl);
  }
}
