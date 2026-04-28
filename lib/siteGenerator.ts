"use server";

import { getFeatureAnimatedIcons } from "@/lib/animatedFeatureIcons";
import { createScene, presetDefaults, type ExportSettings, type Scene, type SceneTrack, type TemplatePreset } from "@/lib/sceneDefinitions";

type ScrapedSiteData = {
  sourceUrl: string;
  productUrl: string;
  siteName: string;
  pageName: string;
  title: string;
  description: string;
  longDescription: string;
  headings: string[];
  paragraphs: string[];
  bullets: string[];
  featureCandidates: string[];
  cta: string[];
  ogImageUrl: string;
  logoImageUrl: string;
  screenshotImageUrls: string[];
  priceLines: string[];
  contactDetails: string[];
  socialLinks: string[];
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

type GeneratedBrandBrief = {
  name: string;
  slogan: string[];
  description: string;
  features: string[];
  stepsToUse: string[];
  cta: string;
  urlLabel: string;
};

type ExtractedSiteSnapshot = {
  url: string;
  domainLabel: string;
  pathname: string;
  isSubpage: boolean;
  pageSlugLabel: string;
  productName: string;
  title: string;
  description: string;
  longDescription: string;
  headings: string[];
  paragraphs: string[];
  bullets: string[];
  featureCandidates: string[];
  cta: string[];
  priceLines: string[];
  contactDetails: string[];
  socialLinks: string[];
  productUrl: string;
  logoImageUrl: string;
  screenshotImageUrls: string[];
};

type SemanticAnalysis = {
  productName: string;
  whatItIs: string;
  targetAudience: string;
  mainProblem: string;
  mainValueProposition: string;
  emotionalHook: string;
  keyBenefits: string[];
  proofPoints: string[];
  adTone: string;
  callToAction: string;
  hasProcess: boolean;
  processSteps: string[];
};

type MarketingPackage = {
  hooks: string[];
  coreAngle: string;
  slogans: string[];
  primaryNarrative: string;
  sceneStrategy: string[];
  brief: GeneratedBrandBrief;
};

type VideoScriptScene = {
  scene: number;
  type: SupportedGeneratedSceneType;
  text: string;
  visual: string;
  voiceover: string;
  duration: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  processStepDescriptions?: string[];
  mediaPosition?: "left" | "right" | "bottom";
};

type VideoScript = {
  projectName: string;
  preset: TemplatePreset;
  scenes: VideoScriptScene[];
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
  brief: GeneratedBrandBrief;
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

function htmlToReadableText(value: string) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|ul|ol|section|article|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, ""),
  )
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function isLowValueSiteText(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized) return true;

  const blockedPhrases = [
    "dev hunt",
    "browse tools",
    "all devtools",
    "upcoming tools",
    "comments, support and feedback",
    "submit your dev tool",
    "sign in",
    "advertise",
    "subscribe",
    "open source",
    "devops",
    "ai",
    "ci",
    "code",
    "nocode",
    "analytics",
    "qa",
    "api",
    "db",
    "design",
    "helpers",
    "hosting",
    "ui library",
    "marketing",
    "emails",
    "framework",
    "language",
    "crypto",
    "web3",
    "charts",
    "ide",
    "monitoring",
    "workflow automation",
    "cms",
    "security",
    "tailwind css",
    "boilerplate",
    "this week",
    "trending launches",
    "about this launch",
    "classified in",
  ];

  if (blockedPhrases.includes(normalized)) return true;
  if (/^(home|login|log in|menu|search|upvote|comments?)$/.test(normalized)) return true;
  if (normalized.split(" ").length <= 3 && blockedPhrases.some((phrase) => normalized === phrase)) return true;
  return false;
}

function isUiOrNavigationNoise(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized) return true;

  if (
    /^new:/i.test(normalized) ||
    /^why [a-z0-9\s'-]+ choose\b/i.test(normalized) ||
    /^how it works$/i.test(normalized) ||
    /^pricing$/i.test(normalized) ||
    /^blog$/i.test(normalized) ||
    /^build brand$/i.test(normalized) ||
    /^free brand audit$/i.test(normalized) ||
    /^why glyph$/i.test(normalized)
  ) {
    return true;
  }

  const navTokenMatches = normalized.match(/\b(pricing|blog|build brand|get started|sign in|login|why glyph|how it works)\b/g) ?? [];
  return navTokenMatches.length >= 2;
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

function matchAllTagText(html: string, tagName: string, maxItems = 20) {
  return matchAllText(html, new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi"), maxItems);
}

function matchAllRawBlocks(html: string, regex: RegExp, maxItems = 10) {
  const values: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) && values.length < maxItems) {
    const value = match[1]?.trim();
    if (value) values.push(value);
  }

  return values;
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

function findMetaContents(html: string, keys: string[]) {
  const values: string[] = [];

  for (const key of keys) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "gi"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "gi"),
      new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "gi"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "gi"),
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html))) {
        const value = match[1] ? decodeHtml(match[1].trim()) : "";
        if (value) values.push(value);
      }
    }
  }

  return uniqueNonEmpty(values);
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

function findAnchorHrefByText(html: string, textPattern: RegExp) {
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html))) {
    const href = match[1] ?? "";
    const text = stripTags(match[2] ?? "");
    if (href && textPattern.test(text)) return href;
  }

  return "";
}

function extractAnchorHrefs(html: string, maxItems = 30) {
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const hrefs: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) && hrefs.length < maxItems) {
    const href = decodeHtml((match[1] ?? "").trim());
    if (href) hrefs.push(href);
  }

  return uniqueNonEmpty(hrefs, maxItems);
}

function extractBulletLines(text: string) {
  const lineBullets = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*•]/.test(line) || /^[A-Z][^:]{2,48}:/.test(line))
    .map((line) => line.replace(/^[-*•]+\s*/, "").trim());
  const inlineBullets = text.includes("•")
    ? text
        .split("•")
        .slice(1)
        .map((part) => part.replace(/\s+/g, " ").trim())
        .filter(Boolean)
    : [];

  return uniqueNonEmpty([...lineBullets, ...inlineBullets].filter((line) => line.length >= 8), 12);
}

function extractParagraphsFromReadableText(text: string) {
  return uniqueNonEmpty(
    text
      .split(/\n{2,}/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter((part) => part.length >= 30),
    12,
  );
}

function extractReadableProseBlocks(html: string) {
  return uniqueNonEmpty(
    matchAllRawBlocks(html, /<div\b[^>]*class=["'][^"']*\bprose\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, 4)
      .map((block) => htmlToReadableText(block))
      .filter(Boolean),
    4,
  );
}

function extractFocusedReadableText(html: string, sourceUrl: string, titleHint: string, pageHint: string, primaryHeading: string) {
  const readableText = htmlToReadableText(html);
  if (!readableText) return "";

  const lines = readableText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const lowerLines = lines.map((line) => line.toLowerCase());
  const focusHints = uniqueNonEmpty([primaryHeading, pageHint, titleHint]).map((value) => value.toLowerCase());
  const stopPatterns = [
    /^classified in$/i,
    /^comments, support and feedback$/i,
    /^about this launch$/i,
    /^trending launches$/i,
    /^subscribe$/i,
    /^browse tools$/i,
    /^all devtools$/i,
    /^member of$/i,
    /^uses & sponsored by$/i,
    /^built by$/i,
  ];

  const startIndex = lowerLines.findIndex((line) => focusHints.some((hint) => hint && line.includes(hint)));
  if (startIndex === -1) return "";

  const collected: string[] = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (stopPatterns.some((pattern) => pattern.test(line))) break;
    if (/^login to comment$/i.test(line)) break;
    if (/^©\s*\d{4}/i.test(line)) break;
    if (/^dev hunt$/i.test(line) && index > startIndex + 2) break;
    collected.push(line);
    if (collected.join("\n").length >= 2200) break;
  }

  if (collected.length === 0) return "";

  const sourceHost = (() => {
    try {
      return new URL(sourceUrl).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  })();

  return uniqueNonEmpty(
    collected.filter((line) => {
      const normalized = line.toLowerCase();
      if (sourceHost && normalized === sourceHost) return false;
      if (normalized.includes("dev hunt") && normalized !== pageHint.toLowerCase()) return false;
      if (isUiOrNavigationNoise(line)) return false;
      return true;
    }),
    24,
  ).join("\n");
}

function extractPriceLines(values: string[]) {
  return uniqueNonEmpty(
    values.filter((item) => /\$|€|£|usd|eur|\/mo|\/month|pricing|plan|starter|pro|business|enterprise|free trial|per month/i.test(item)),
    6,
  );
}

function extractContactDetails(values: string[]) {
  const contacts = values.flatMap((value) => {
    const found: string[] = [];
    const emails = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
    const phones = value.match(/\+?\d[\d\s().-]{6,}\d/g) ?? [];
    found.push(...emails, ...phones.map((item) => item.replace(/\s+/g, " ").trim()));
    return found;
  });

  return uniqueNonEmpty(contacts, 6);
}

function extractSocialLinks(hrefs: string[], sourceUrl: string) {
  return uniqueNonEmpty(
    hrefs
      .filter((href) => /twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com|youtube\.com|tiktok\.com|github\.com/i.test(href))
      .map((href) => absolutizeUrl(href, sourceUrl))
      .filter(Boolean),
    6,
  );
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
    if (/rounded-full|rounded-circle/.test(joined)) score += 2;
    if (/w-16|h-16|w-20|h-20/.test(joined)) score += 1;
    if (/icon/.test(joined)) score += 1;
    if (/avatar|author|banner|product|screenshot/.test(joined)) score -= 3;
    if (/\.(svg|png|webp|jpg|jpeg)(\?|$)/i.test(src)) score += 1;
    if (score > 0) candidates.push({ score, src: absolutizeUrl(decodeHtml(src), sourceUrl) });
  }

  const bestImageCandidate = candidates.sort((a, b) => b.score - a.score)[0]?.src ?? "";
  const iconCandidate =
    findLinkHref(html, /(?:^|\s)(?:apple-touch-icon|mask-icon|shortcut icon|icon)(?:\s|$)/i) ||
    findMetaContent(html, ["og:logo"]);

  return absolutizeUrl(bestImageCandidate || iconCandidate, sourceUrl);
}

function findScreenshotImageUrls(html: string, sourceUrl: string, pageName: string, siteName: string) {
  const imageTagRegex = /<img\b[^>]*>/gi;
  const candidates: Array<{ score: number; src: string }> = [];
  let match: RegExpExecArray | null;
  const nameHints = [pageName, siteName].filter(Boolean).map((value) => value.toLowerCase());

  while ((match = imageTagRegex.exec(html))) {
    const tag = match[0] ?? "";
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? "";
    if (!src) continue;

    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "";
    const className = tag.match(/\bclass=["']([^"']*)["']/i)?.[1] ?? "";
    const joined = [src, alt, className].join(" ").toLowerCase();

    let score = 0;
    if (/tweet-|screenshot|gallery|preview|product|screen|demo/.test(joined)) score += 6;
    if (/imgix|cloudfront|cdn/.test(joined)) score += 2;
    if (nameHints.some((hint) => hint && joined.includes(hint))) score += 2;
    if (/youtube|avatar|user\.svg|badge|logo|icon|rounded-full|author/.test(joined)) score -= 5;
    if (/\.(png|webp|jpg|jpeg)(\?|$)/i.test(src)) score += 1;

    if (score > 0) {
      candidates.push({ score, src: absolutizeUrl(decodeHtml(src), sourceUrl) });
    }
  }

  return uniqueNonEmpty(
    candidates
      .sort((a, b) => b.score - a.score)
      .map((candidate) => candidate.src)
      .filter(Boolean),
    6,
  );
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
  const tentativeHeadings = uniqueNonEmpty(
    [
      ...matchAllTagText(cleanedHtml, "h1", 4),
      ...matchAllTagText(cleanedHtml, "h2", 8),
    ].filter((item) => !isLowValueSiteText(item)),
    8,
  );
  const primaryHeading = tentativeHeadings[0] || "";
  const tentativePageName = resolvePageName(url, siteName, title, tentativeHeadings);
  const focusedReadableText = extractFocusedReadableText(cleanedHtml, url, title, tentativePageName, primaryHeading);
  const proseBlocks = extractReadableProseBlocks(cleanedHtml);
  const proseParagraphs = proseBlocks.flatMap((block) => extractParagraphsFromReadableText(block));
  const proseBullets = proseBlocks.flatMap((block) => extractBulletLines(block));
  const focusedParagraphs = focusedReadableText ? extractParagraphsFromReadableText(focusedReadableText) : [];
  const focusedBullets = focusedReadableText ? extractBulletLines(focusedReadableText) : [];
  const description =
    findMetaContent(cleanedHtml, ["description", "og:description", "twitter:description"]) ||
    focusedParagraphs[0] ||
    matchAllTagText(cleanedHtml, "p", 1)[0] ||
    proseParagraphs[0] ||
    "";
  const longDescription = focusedParagraphs[0] || proseParagraphs[0] || description;
  const headings = tentativeHeadings;
  const paragraphSource = focusedParagraphs.length > 0 ? focusedParagraphs : proseParagraphs.length > 0 ? proseParagraphs : matchAllTagText(cleanedHtml, "p", 12);
  const bulletSource = focusedBullets.length > 0 ? focusedBullets : proseBullets.length > 0 ? proseBullets : matchAllTagText(cleanedHtml, "li", 12);
  const paragraphs = uniqueNonEmpty(
    paragraphSource.filter((item) => item.length > 35 && !isLowValueSiteText(item) && !isUiOrNavigationNoise(item)),
    12,
  );
  const bullets = uniqueNonEmpty(
    bulletSource.filter((item) => item.length > 8 && !isLowValueSiteText(item) && !isUiOrNavigationNoise(item)),
    12,
  );
  const featureCandidates = extractFeatureCandidates(headings, bullets, paragraphs);
  const cta = uniqueNonEmpty(
    [
      stripTags(cleanedHtml.match(/<a\b[^>]*href=["'][^"']+["'][^>]*>Live preview<\/a>/i)?.[0] ?? ""),
      ...matchAllText(cleanedHtml, /<(?:a|button)[^>]*>([\s\S]*?)<\/(?:a|button)>/gi, 20),
      ...bullets.filter((item) => /start|get|book|try|demo|sign|launch|contact|join/i.test(item)),
    ],
    6,
  ).filter((item) => item.length < 60 && !isLowValueSiteText(item));
  const allOgImages = findMetaContents(cleanedHtml, ["og:image", "twitter:image"]).map((value) => absolutizeUrl(value, url)).filter(Boolean);
  const pageName = tentativePageName;
  const screenshotImageUrls = findScreenshotImageUrls(cleanedHtml, url, pageName, siteName);
  const ogImageUrl = screenshotImageUrls[0] || allOgImages[0] || "";
  const logoImageUrl = findLogoImageUrl(cleanedHtml, url);
  const productUrl = absolutizeUrl(findAnchorHrefByText(cleanedHtml, /live preview|visit|open app|get started|launch/i), url) || url;
  const hrefs = extractAnchorHrefs(cleanedHtml);
  const priceLines = extractPriceLines([...bullets, ...paragraphs, ...headings]);
  const contactDetails = extractContactDetails([...paragraphs, ...bullets, ...cta, cleanedHtml]);
  const socialLinks = extractSocialLinks(hrefs, url);

  return {
    sourceUrl: url,
    productUrl,
    siteName,
    pageName,
    title,
    description,
    longDescription,
    headings,
    paragraphs,
    bullets,
    featureCandidates,
    cta,
    ogImageUrl,
    logoImageUrl,
    screenshotImageUrls,
    priceLines,
    contactDetails,
    socialLinks,
  };
}

function applyScene(scene: Scene, updates: Partial<Omit<Scene, "id" | "type">>) {
  return { ...scene, ...updates };
}

function takeBullets(values: string[], maxItems = 3) {
  return uniqueNonEmpty(values.map((item) => normalizeReadableCopy(item, 90)).filter(Boolean), maxItems).slice(0, maxItems);
}

function randomChoice<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)] as T;
}

const generatedPresets = Object.keys(presetDefaults) as TemplatePreset[];
const templatePresetEnum = generatedPresets.map((preset) => `"${preset}"`).join(" | ");

function removeDanglingEnding(value: string) {
  return value
    .replace(/\s+(and|or|but|with|for|to|of|in|on|at|by|from|than|that|which|who|whose)$/i, "")
    .replace(/[-,:;\/]+$/g, "")
    .trim();
}

function truncateAtWordBoundary(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength + 1);
  const boundaryMatch = sliced.match(/^(.+?)(?:\s+\S*)?$/);
  const boundaryValue = boundaryMatch?.[1]?.trim() || normalized.slice(0, maxLength).trim();
  return removeDanglingEnding(boundaryValue);
}

function normalizeReadableCopy(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const cleaned = removeDanglingEnding(truncateAtWordBoundary(normalized, maxLength));
  return cleaned.length >= 2 ? cleaned : "";
}

function toShortLine(value: string, fallback: string, maxLength: number) {
  return normalizeReadableCopy(value, maxLength) || normalizeReadableCopy(fallback, maxLength);
}

function compactMarketingLine(value: string, maxLength = 32) {
  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/[,:;()]+/g, "")
    .trim();
  return normalizeReadableCopy(cleaned, maxLength);
}

function toDescriptionSceneLine(value: string, fallback: string) {
  return compactMarketingLine(value || fallback, 24);
}

function dedupeTextOptions(values: string[], maxLength: number) {
  return uniqueNonEmpty(
    values
      .map((value) => normalizeReadableCopy(value, maxLength))
      .filter(Boolean)
      .map((value) => value),
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
  return normalizeReadableCopy(
    value
    .replace(/\s+/g, " ")
    .replace(/^[\-\u2022*]+\s*/, "")
    .replace(/[.]+$/g, "")
    .trim(),
    56,
  );
}

function isWeakMarketingCopy(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  if (isUiOrNavigationNoise(normalized)) return true;
  if (/^(why|how|what|new)\b/i.test(normalized)) return true;
  if (normalized.split(" ").length < 2) return true;
  return false;
}

function extractBenefitStatements(values: string[], maxItems = 6) {
  return uniqueNonEmpty(
    values
      .flatMap((value) => splitIntoPhrases(value))
      .map((value) => normalizeReadableCopy(value, 72))
      .filter((value) => value.length >= 12 && !isWeakMarketingCopy(value))
      .filter((value) => /built|create|generate|export|launch|design|brand|system|code|workflow|team|fast|simple|complete|developers|founders/i.test(value)),
    maxItems,
  ).slice(0, maxItems);
}

function buildMeaningfulSloganLines(values: string[], fallbackName: string) {
  const phraseCandidates = uniqueNonEmpty(
    values
      .flatMap((value) => splitIntoPhrases(value))
      .map((line) => toDescriptionSceneLine(line, fallbackName))
      .filter((line) => !isWeakMarketingCopy(line)),
    12,
  );
  const chunkCandidates = pickShortSloganLines(values, fallbackName)
    .map((line) => toDescriptionSceneLine(line, fallbackName))
    .filter((line) => !isWeakMarketingCopy(line));

  const uniqueCandidates = uniqueNonEmpty([...phraseCandidates, ...chunkCandidates], 3);
  if (uniqueCandidates.length >= 3) return uniqueCandidates.slice(0, 3);

  const fallbacks = [
    toDescriptionSceneLine("Complete brand system", "Complete brand system"),
    toDescriptionSceneLine("Built for developers", "Built for developers"),
    toDescriptionSceneLine("Ready to ship", "Ready to ship"),
  ].filter((line) => !isWeakMarketingCopy(line));

  return uniqueNonEmpty([...uniqueCandidates, ...fallbacks], 3).slice(0, 3);
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
      if (isLowValueSiteText(shortened)) return null;
      let score = index < bullets.length ? 4 : 0;
      if (/feature|benefit|why|capabilit|automation|analytics|insight|workflow|secure|fast|simple|collaboration|team|export|integrat/i.test(text)) score += 3;
      if (text.split(/\s+/).length <= 8) score += 2;
      if (shortened.length >= 12 && shortened.length <= 56) score += 1;
      if (/contact|pricing|login|sign in|book demo|get started|learn more/.test(text)) score -= 3;
      return { text: shortened, score };
    })
    .filter((item): item is { text: string; score: number } => Boolean(item && item.text.length >= 8))
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
  const supportingParagraph = scraped.longDescription || scraped.paragraphs[0] || scraped.description;
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
    ].filter((item) => !isLowValueSiteText(item)),
    6,
  );
  const processSteps =
    processCandidates.length >= 3
      ? processCandidates.slice(0, 3)
      : [];

  return {
    name: projectName,
    slogan: [
      toDescriptionSceneLine(sloganLines[0] || scraped.headings[1] || heroTitle, "Built for modern teams"),
      toDescriptionSceneLine(sloganLines[1] || scraped.headings[2] || scraped.description || heroSubtitle, "Clear product communication"),
      toDescriptionSceneLine(sloganLines[2] || scraped.headings[3] || supportingParagraph || `Explore ${projectName}`, "Fast demos and exports"),
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
  const normalizedDomain = normalizedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const processBullets = takeBullets(brief.stepsToUse, 3);
  const hasProcess = processBullets.length === 3;
  const aiLikeBrief: GeneratedBrandBrief = {
    name: projectName,
    slogan: [
      toDescriptionSceneLine(brief.slogan[0] || projectName, projectName),
      toDescriptionSceneLine(brief.slogan[1] || brief.description || "Clear product value", "Clear product value"),
      toDescriptionSceneLine(brief.slogan[2] || "Built for fast understanding", "Built for fast understanding"),
    ],
    description: toShortLine(brief.description || `Explore ${projectName}.`, `Explore ${projectName}.`, 180),
    features: takeBullets(brief.features, 3),
    stepsToUse: hasProcess ? processBullets : [],
    cta: toShortLine(brief.cta || `Visit ${projectName}`, `Visit ${projectName}`, 90),
    urlLabel: normalizedDomain,
  };

  const scenes: GeneratedScenePlan[] = [
    {
      type: "brand-reveal",
      eyebrow: getDomainLabel(normalizedUrl),
      title: aiLikeBrief.name,
      subtitle: aiLikeBrief.description.slice(0, 110),
      description: "",
      bullets: [],
    },
    {
      type: "description",
      eyebrow: "Slogan",
      title: aiLikeBrief.slogan[0] || aiLikeBrief.name,
      subtitle: aiLikeBrief.slogan[1] || aiLikeBrief.description,
      description: aiLikeBrief.slogan[2] || aiLikeBrief.description,
      bullets: [],
    },
    {
      type: "feature-grid",
      eyebrow: "Why choose it",
      title: `Why ${projectName} stands out`,
      subtitle: aiLikeBrief.description.slice(0, 120),
      description: "",
      bullets: aiLikeBrief.features,
    },
    ...(hasProcess
      ? [
          {
            type: "process" as const,
            eyebrow: "How it works",
            title: `Use ${projectName} in 3 steps`,
            subtitle: aiLikeBrief.description.slice(0, 72),
            description: "",
            bullets: aiLikeBrief.stepsToUse,
            processStepDescriptions: aiLikeBrief.stepsToUse.map((step) => toShortLine(step, step, 48)),
          },
        ]
      : []),
    {
      type: "cta-panel",
      eyebrow: "Call to action",
      title: aiLikeBrief.cta,
      subtitle: normalizedDomain,
      description: "Get started",
      bullets: [],
    },
    {
      type: "website-url",
      eyebrow: "Website",
      title: aiLikeBrief.urlLabel.toLowerCase(),
      subtitle: "",
      description: "",
      bullets: [],
    },
  ];

  return {
    projectName,
    preset: randomChoice(generatedPresets),
    brief: aiLikeBrief,
    scenes: scenes.slice(0, MAX_GENERATED_SCENES),
  };
}

function buildCompactSiteText(snapshot: ExtractedSiteSnapshot) {
  return [
    snapshot.title,
    snapshot.description,
    snapshot.longDescription,
    ...snapshot.headings,
    ...snapshot.paragraphs,
    ...snapshot.bullets,
    ...snapshot.featureCandidates,
    ...snapshot.cta,
    ...snapshot.priceLines,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 3500);
}

function buildDeterministicSemanticAnalysis(snapshot: ExtractedSiteSnapshot, brief: ExtractedSiteBrief): SemanticAnalysis {
  const processSteps = takeBullets(brief.stepsToUse, 3);
  const benefitStatements = extractBenefitStatements([
    snapshot.description,
    snapshot.longDescription,
    ...snapshot.paragraphs,
    ...snapshot.featureCandidates,
    ...snapshot.bullets,
  ]);

  return {
    productName: brief.name || snapshot.productName,
    whatItIs: toShortLine(snapshot.description || snapshot.longDescription || `A digital product from ${snapshot.domainLabel}.`, `A digital product from ${snapshot.domainLabel}.`, 180),
    targetAudience: toShortLine(snapshot.headings[1] || snapshot.featureCandidates[0] || "Teams looking for a clearer workflow", "Teams looking for a clearer workflow", 120),
    mainProblem: toShortLine(snapshot.paragraphs[0] || "Manual work slows down understanding and adoption.", "Manual work slows down understanding and adoption.", 140),
    mainValueProposition: toShortLine(brief.description || snapshot.description || `Explore ${brief.name}.`, `Explore ${brief.name}.`, 160),
    emotionalHook: toShortLine(brief.slogan[0] || snapshot.headings[1] || brief.name, brief.name, 64),
    keyBenefits: takeBullets(brief.features.length ? brief.features : benefitStatements, 3),
    proofPoints: takeBullets([...snapshot.priceLines, ...snapshot.contactDetails, ...snapshot.featureCandidates], 3),
    adTone: /luxury|premium|exclusive/i.test(snapshot.longDescription) ? "luxury" : /fun|playful|creative/i.test(snapshot.longDescription) ? "playful" : "corporate",
    callToAction: toShortLine(brief.cta || snapshot.cta[0] || `Visit ${brief.name}`, `Visit ${brief.name}`, 90),
    hasProcess: processSteps.length === 3,
    processSteps: processSteps.length === 3 ? processSteps : [],
  };
}

function buildDeterministicMarketingPackage(
  snapshot: ExtractedSiteSnapshot,
  semantic: SemanticAnalysis,
  brief: ExtractedSiteBrief,
  normalizedUrl: string,
): MarketingPackage {
  const urlLabel = normalizedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const fallbackBenefits = extractBenefitStatements([
    semantic.mainValueProposition,
    semantic.whatItIs,
    snapshot.description,
    snapshot.longDescription,
    ...snapshot.paragraphs,
    ...snapshot.featureCandidates,
  ]);
  const slogans = [
    toDescriptionSceneLine(brief.slogan[0] || semantic.emotionalHook, semantic.emotionalHook),
    toDescriptionSceneLine(brief.slogan[1] || semantic.mainValueProposition, semantic.mainValueProposition),
    toDescriptionSceneLine(brief.slogan[2] || semantic.targetAudience, semantic.targetAudience),
  ];

  return {
    hooks: uniqueNonEmpty(
      [
        semantic.emotionalHook,
        semantic.mainValueProposition,
        semantic.keyBenefits[0] || "",
        snapshot.cta[0] || "",
      ],
      4,
    ),
    coreAngle: toShortLine(semantic.mainValueProposition, `Why ${semantic.productName} stands out`, 120),
    slogans,
    primaryNarrative: toShortLine(snapshot.longDescription || semantic.whatItIs, semantic.whatItIs, 180),
    sceneStrategy: [
      "Introduce the product clearly",
      "Deliver a concise 3-line slogan",
      "Show 3 reasons to choose it",
      ...(semantic.hasProcess ? ["Explain the 3-step usage flow"] : []),
      "End with a direct CTA",
      "Close on the clean URL",
    ],
    brief: {
      name: semantic.productName,
      slogan: slogans,
      description: toShortLine(semantic.mainValueProposition, semantic.whatItIs, 180),
      features: takeBullets(semantic.keyBenefits.length ? semantic.keyBenefits : fallbackBenefits, 3),
      stepsToUse: semantic.hasProcess ? takeBullets(semantic.processSteps, 3) : [],
      cta: semantic.callToAction,
      urlLabel,
    },
  };
}

function buildDeterministicVideoScript(marketing: MarketingPackage): VideoScript {
  const hasProcess = marketing.brief.stepsToUse.length === 3;
  const scenes: VideoScriptScene[] = [
    {
      scene: 1,
      type: "brand-reveal",
      text: marketing.brief.name,
      visual: "logo reveal with clean brand entrance",
      voiceover: marketing.hooks[0] || marketing.brief.name,
      duration: 2.4,
      eyebrow: "Intro",
      title: marketing.brief.name,
      subtitle: marketing.brief.description.slice(0, 110),
      description: "",
      bullets: [],
    },
    {
      scene: 2,
      type: "description",
      text: marketing.brief.slogan.join(" | "),
      visual: "kinetic text with three short lines",
      voiceover: marketing.primaryNarrative,
      duration: 2.7,
      eyebrow: "Slogan",
      title: marketing.brief.slogan[0],
      subtitle: marketing.brief.slogan[1],
      description: marketing.brief.slogan[2],
      bullets: [],
    },
    {
      scene: 3,
      type: "feature-grid",
      text: marketing.brief.features.join(" | "),
      visual: "feature grid with product proof points",
      voiceover: marketing.coreAngle,
      duration: 3,
      eyebrow: "Why choose it",
      title: `Why ${marketing.brief.name} stands out`,
      subtitle: marketing.brief.description.slice(0, 120),
      description: "",
      bullets: marketing.brief.features,
    },
    ...(hasProcess
      ? [
          {
            scene: 4,
            type: "process" as const,
            text: marketing.brief.stepsToUse.join(" | "),
            visual: "step-by-step workflow sequence",
            voiceover: "See how the workflow comes together in three simple steps.",
            duration: 3,
            eyebrow: "How it works",
            title: `Use ${marketing.brief.name} in 3 steps`,
            subtitle: marketing.brief.description.slice(0, 72),
            description: "",
            bullets: marketing.brief.stepsToUse,
            processStepDescriptions: marketing.brief.stepsToUse.map((step) => toShortLine(step, step, 48)),
          },
        ]
      : []),
    {
      scene: hasProcess ? 5 : 4,
      type: "cta-panel",
      text: marketing.brief.cta,
      visual: "call-to-action panel",
      voiceover: marketing.brief.cta,
      duration: 2.4,
      eyebrow: "Call to action",
      title: marketing.brief.cta,
      subtitle: marketing.brief.urlLabel,
      description: "Get started",
      bullets: [],
    },
    {
      scene: hasProcess ? 6 : 5,
      type: "website-url",
      text: marketing.brief.urlLabel,
      visual: "clean domain lockup",
      voiceover: marketing.brief.urlLabel,
      duration: 1.8,
      eyebrow: "Website",
      title: marketing.brief.urlLabel.toLowerCase(),
      subtitle: "",
      description: "",
      bullets: [],
    },
  ];

  return {
    projectName: marketing.brief.name,
    preset: randomChoice(generatedPresets),
    scenes,
  };
}

function buildExtractedSiteSnapshot(scraped: ScrapedSiteData, normalizedUrl: string): ExtractedSiteSnapshot {
  return {
    url: normalizedUrl,
    domainLabel: getDomainLabel(normalizedUrl),
    pathname: getUrlPathname(normalizedUrl),
    isSubpage: isSubpageUrl(normalizedUrl),
    pageSlugLabel: getPageSlugLabel(normalizedUrl),
    productName: scraped.pageName || scraped.siteName || scraped.title || getDomainLabel(normalizedUrl),
    title: scraped.title,
    description: scraped.description,
    longDescription: scraped.longDescription,
    headings: scraped.headings.slice(0, 6),
    paragraphs: scraped.paragraphs.slice(0, 4),
    bullets: scraped.bullets.slice(0, 6),
    featureCandidates: scraped.featureCandidates.slice(0, 6),
    cta: scraped.cta.slice(0, 4),
    priceLines: scraped.priceLines.slice(0, 4),
    contactDetails: scraped.contactDetails.slice(0, 4),
    socialLinks: scraped.socialLinks.slice(0, 4),
    productUrl: scraped.productUrl,
    logoImageUrl: scraped.logoImageUrl,
    screenshotImageUrls: scraped.screenshotImageUrls.slice(0, 4),
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

function buildProjectPlanFromVideoScript(marketing: MarketingPackage, script: VideoScript): GeneratedProjectPlan {
  const cleanSlogans = buildMeaningfulSloganLines(
    [
      ...marketing.brief.slogan,
      marketing.brief.description,
      ...marketing.brief.features,
      marketing.primaryNarrative,
      marketing.coreAngle,
    ],
    marketing.brief.name,
  );
  const cleanFeatures = takeBullets(marketing.brief.features.filter((line) => !isWeakMarketingCopy(line)), 3);
  const cleanSteps = takeBullets(marketing.brief.stepsToUse.filter((line) => !isWeakMarketingCopy(line)), 3);

  return {
    projectName: script.projectName || marketing.brief.name,
    preset: generatedPresets.includes(script.preset) ? script.preset : randomChoice(generatedPresets),
    brief: {
      ...marketing.brief,
      slogan: cleanSlogans,
      features: cleanFeatures.length === 3 ? cleanFeatures : marketing.brief.features,
      stepsToUse: cleanSteps.length === 3 ? cleanSteps : marketing.brief.stepsToUse,
    },
    scenes: script.scenes.map((scene) => ({
      type: scene.type,
      eyebrow: scene.eyebrow,
      title: scene.title,
      subtitle: scene.subtitle,
      description: scene.description,
      bullets: scene.bullets,
      processStepDescriptions: scene.processStepDescriptions,
      mediaPosition: scene.mediaPosition,
    })),
  };
}

function buildProjectPayloadFromPlan(plan: GeneratedProjectPlan, scraped: ScrapedSiteData, normalizedUrl: string): GeneratedProjectPayload {
  const projectName = normalizePlanValue(plan.projectName, scraped.pageName || scraped.siteName || scraped.title || getDomainLabel(normalizedUrl), 80);
  const normalizedDomain = normalizedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const preset = generatedPresets.includes(plan.preset) ? plan.preset : "white";
  const presetColors = presetDefaults[preset];
  const brief = plan.brief;
  const scenes: Scene[] = [];
  const usedSceneText = new Set<string>();
  const primaryVisualUrl = scraped.screenshotImageUrls[0] || scraped.ogImageUrl;
  const fallbackFeatureBullets = takeBullets(scraped.bullets.length ? scraped.bullets : scraped.headings.slice(1), 3);
  const featureFallbackSource = brief?.features?.length ? brief.features : scraped.featureCandidates.length ? scraped.featureCandidates : fallbackFeatureBullets;
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
              title: normalizePlanValue(brief?.name, projectName, 90),
              subtitle: normalizePlanValue(scenePlan.subtitle, brief?.description || scraped.description || "", 120),
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
        scenes.push(
          withDuration(
            applyScene(scene, {
              ...baseUpdates,
              title:
                scenePlan.type === "description"
                  ? normalizePlanValue(brief?.slogan?.[0], baseUpdates.title || projectName, 90)
                  : scenePlan.type === "website-url"
                  ? normalizePlanValue(scenePlan.title, brief?.urlLabel || normalizedDomain, 90)
                  : scenePlan.type === "cta-panel"
                    ? normalizePlanValue(scenePlan.title, brief?.cta || `Visit ${projectName}`, 90)
                    : baseUpdates.title,
              subtitle:
                scenePlan.type === "description"
                  ? normalizePlanValue(brief?.slogan?.[1], baseUpdates.subtitle || scraped.description || "", 120)
                  : baseUpdates.subtitle,
              description:
                scenePlan.type === "description"
                  ? normalizePlanValue(brief?.slogan?.[2], baseUpdates.description || "", 120)
                  : baseUpdates.description,
            }),
            scene.durationSeconds,
          ),
        );
        break;
      case "product-showcase":
      case "website-scroll":
      case "website-scroll-overlay":
      case "website-scroll-front":
        scenes.push(
          withDuration(
            applyScene(scene, {
              ...baseUpdates,
              websiteImageUrl: primaryVisualUrl,
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
        const descriptions = uniqueNonEmpty(
          (scenePlan.processStepDescriptions ?? []).map((item) => toShortLine(item, "", 56)).filter(Boolean).slice(0, 3),
          3,
        );
        scenes.push(
          withDuration(
            applyScene(scene, {
              ...baseUpdates,
              bullets: bullets.length === 3 ? bullets : brief?.stepsToUse?.length === 3 ? brief.stepsToUse : [`Add ${projectName}`, "Shape the message", "Publish the result"],
              processStepDescriptions:
                descriptions.length === 3
                  ? descriptions
                  : brief?.stepsToUse?.length === 3
                    ? brief.stepsToUse.map((step) => toShortLine(step, step, 56))
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

async function requestOpenAiStructuredJson<T>({
  model,
  schemaName,
  schema,
  systemPrompt,
  userPrompt,
}: {
  model: string;
  schemaName: string;
  schema: Record<string, unknown>;
  systemPrompt: string;
  userPrompt: string;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

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
              text: systemPrompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userPrompt,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  return readOpenAiJsonResponse<T>(response, model, schemaName);
}

async function requestOpenAiSemanticAnalysis(snapshot: ExtractedSiteSnapshot, model: string): Promise<SemanticAnalysis> {
  const semantic = await requestOpenAiStructuredJson<Partial<SemanticAnalysis>>({
    model,
    schemaName: "website_semantic_analysis",
    systemPrompt:
      "You are a marketing analyst. Analyze extracted website data and return only grounded semantic product understanding. Return valid JSON only and never invent unsupported claims. If the source page is a directory, launch platform, or listing page, analyze the specific product/entity on that page, not the host platform itself.",
    userPrompt: `Analyze this extracted website snapshot and return a structured semantic profile.\n\nInput:\n${JSON.stringify(
      {
        ...snapshot,
        compactText: buildCompactSiteText(snapshot),
      },
      null,
      2,
    )}\n\nRules:\n- Ignore navigation labels, menu items, banner announcements, login/signup prompts, blog links, and section headings unless they contain real product meaning\n- keyBenefits must be complete standalone phrases with clear meaning, not labels or fragments\n- Never return unfinished clauses ending in words like and, with, for, to\n\nReturn fields:\n- productName\n- whatItIs\n- targetAudience\n- mainProblem\n- mainValueProposition\n- emotionalHook\n- keyBenefits (3 items)\n- proofPoints (0-3 items)\n- adTone\n- callToAction\n- hasProcess\n- processSteps (exactly 3 only if clearly supported, else empty array)`,
    schema: {
      type: "object",
      properties: {
        productName: { type: "string" },
        whatItIs: { type: "string" },
        targetAudience: { type: "string" },
        mainProblem: { type: "string" },
        mainValueProposition: { type: "string" },
        emotionalHook: { type: "string" },
        keyBenefits: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
        proofPoints: { type: "array", maxItems: 3, items: { type: "string" } },
        adTone: { type: "string" },
        callToAction: { type: "string" },
        hasProcess: { type: "boolean" },
        processSteps: { type: "array", maxItems: 3, items: { type: "string" } },
      },
      required: [
        "productName",
        "whatItIs",
        "targetAudience",
        "mainProblem",
        "mainValueProposition",
        "emotionalHook",
        "keyBenefits",
        "proofPoints",
        "adTone",
        "callToAction",
        "hasProcess",
        "processSteps",
      ],
      additionalProperties: false,
    },
  });

  if (
    !semantic.productName ||
    !semantic.whatItIs ||
    !semantic.targetAudience ||
    !semantic.mainProblem ||
    !semantic.mainValueProposition ||
    !semantic.emotionalHook ||
    !Array.isArray(semantic.keyBenefits) ||
    semantic.keyBenefits.length !== 3 ||
    !Array.isArray(semantic.proofPoints) ||
    !semantic.adTone ||
    !semantic.callToAction ||
    typeof semantic.hasProcess !== "boolean" ||
    !Array.isArray(semantic.processSteps) ||
    (semantic.hasProcess && semantic.processSteps.length !== 3) ||
    (!semantic.hasProcess && semantic.processSteps.length !== 0)
  ) {
    throw new Error("OpenAI returned an incomplete semantic analysis.");
  }

  return semantic as SemanticAnalysis;
}

async function requestOpenAiMarketingPackage(
  snapshot: ExtractedSiteSnapshot,
  semantic: SemanticAnalysis,
  model: string,
): Promise<MarketingPackage> {
  const marketing = await requestOpenAiStructuredJson<Partial<MarketingPackage>>({
    model,
    schemaName: "website_marketing_package",
    systemPrompt:
      "You are a performance marketing strategist. Turn structured product understanding into concise ad-ready messaging. Return valid JSON only and keep copy short, distinct, and motion-graphics-friendly. Always market the product/entity being analyzed, not the directory or launch platform hosting the page.",
    userPrompt: `Create a marketing package from this extracted website snapshot and semantic analysis.\n\nSnapshot:\n${JSON.stringify(
      {
        url: snapshot.url,
        productName: snapshot.productName,
        cta: snapshot.cta,
        priceLines: snapshot.priceLines,
        featureCandidates: snapshot.featureCandidates,
        compactText: buildCompactSiteText(snapshot),
      },
      null,
      2,
    )}\n\nSemantic analysis:\n${JSON.stringify(semantic, null, 2)}\n\nRequirements:\n- hooks: 3 to 5 ad hooks\n- coreAngle: one main marketing angle\n- slogans: exactly 3 short lines, usually 2 to 3 words each, ideally under 24 characters per line\n- primaryNarrative: one concise summary paragraph for the overall ad story\n- sceneStrategy: 5 to 6 short scene intentions in order\n- brief must contain name, slogan, description, features, stepsToUse, cta, urlLabel\n- brief.features must be exactly 3 benefits\n- brief.stepsToUse must be exactly 3 items only when semantic.hasProcess is true, else empty array\n- brief.urlLabel must remove protocol noise like https://\n- slogans and features must be complete, meaningful, self-contained phrases\n- do not return section labels, menu labels, announcement copy, or unfinished fragments`,
    schema: {
      type: "object",
      properties: {
        hooks: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
        coreAngle: { type: "string" },
        slogans: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
        primaryNarrative: { type: "string" },
        sceneStrategy: { type: "array", minItems: 5, maxItems: 6, items: { type: "string" } },
        brief: {
          type: "object",
          properties: {
            name: { type: "string" },
            slogan: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
            description: { type: "string" },
            features: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
            stepsToUse: { type: "array", maxItems: 3, items: { type: "string" } },
            cta: { type: "string" },
            urlLabel: { type: "string" },
          },
          required: ["name", "slogan", "description", "features", "stepsToUse", "cta", "urlLabel"],
          additionalProperties: false,
        },
      },
      required: ["hooks", "coreAngle", "slogans", "primaryNarrative", "sceneStrategy", "brief"],
      additionalProperties: false,
    },
  });

  if (
    !Array.isArray(marketing.hooks) ||
    marketing.hooks.length < 3 ||
    !marketing.coreAngle ||
    !Array.isArray(marketing.slogans) ||
    marketing.slogans.length !== 3 ||
    !marketing.primaryNarrative ||
    !Array.isArray(marketing.sceneStrategy) ||
    !marketing.brief ||
    !marketing.brief.name ||
    !Array.isArray(marketing.brief.slogan) ||
    marketing.brief.slogan.length !== 3 ||
    !marketing.brief.description ||
    !Array.isArray(marketing.brief.features) ||
    marketing.brief.features.length !== 3 ||
    !Array.isArray(marketing.brief.stepsToUse) ||
    !marketing.brief.cta ||
    !marketing.brief.urlLabel ||
    (semantic.hasProcess && marketing.brief.stepsToUse.length !== 3) ||
    (!semantic.hasProcess && marketing.brief.stepsToUse.length !== 0)
  ) {
    throw new Error("OpenAI returned an incomplete marketing package.");
  }

  return marketing as MarketingPackage;
}

async function requestOpenAiVideoScript(
  snapshot: ExtractedSiteSnapshot,
  semantic: SemanticAnalysis,
  marketing: MarketingPackage,
  model: string,
): Promise<VideoScript> {
  const script = await requestOpenAiStructuredJson<Partial<VideoScript>>({
    model,
    schemaName: "website_video_script",
    systemPrompt:
      "You are a motion ad scriptwriter. Convert structured marketing inputs into a fixed scene-by-scene promo script. Return valid JSON only. Keep each scene direct, visual, and easy to render. Always script the product/entity being analyzed, not the host directory or listing platform.",
    userPrompt: `Create a video script from the extracted website snapshot, semantic analysis, and marketing package.\n\nSnapshot:\n${JSON.stringify(
      {
        url: snapshot.url,
        productName: snapshot.productName,
        logoImageUrl: snapshot.logoImageUrl,
        screenshotImageUrls: snapshot.screenshotImageUrls,
        productUrl: snapshot.productUrl,
      },
      null,
      2,
    )}\n\nSemantic analysis:\n${JSON.stringify(semantic, null, 2)}\n\nMarketing package:\n${JSON.stringify(marketing, null, 2)}\n\nRequirements:\n- Return exactly 5 scenes when marketing.brief.stepsToUse is empty\n- Return exactly 6 scenes when marketing.brief.stepsToUse has 3 items\n- Scene order must be: intro, description, feature-grid, optional process, cta-panel, website-url\n- Scene 1 type must be one of: ${introSceneTypes.join(", ")}\n- Only use these types: brand-reveal, brand-reveal-alt, brand-reveal-circle, description, feature-grid, process, cta-panel, website-url\n- Every scene needs: scene, type, text, visual, voiceover, duration, eyebrow, title, subtitle, description, bullets\n- intro scene title must be the exact product name from marketing.brief.name, not a marketing hook\n- description scene must use the 3 slogan lines from the brief across title, subtitle, description\n- each description line should stay very short, ideally under 24 characters\n- feature-grid must use exactly 3 bullets from brief.features\n- process scene must include exactly 3 bullets and 3 processStepDescriptions, only if the brief has process steps\n- URL scene title must contain only the clean url label without protocol`,
    schema: {
      type: "object",
      properties: {
        projectName: { type: "string" },
        preset: { type: "string", enum: generatedPresets },
        scenes: {
          type: "array",
          minItems: 5,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              scene: { type: "integer" },
              type: { type: "string", enum: ["brand-reveal", "brand-reveal-alt", "brand-reveal-circle", "description", "feature-grid", "process", "cta-panel", "website-url"] },
              text: { type: "string" },
              visual: { type: "string" },
              voiceover: { type: "string" },
              duration: { type: "number" },
              eyebrow: { type: "string" },
              title: { type: "string" },
              subtitle: { type: "string" },
              description: { type: "string" },
              bullets: { type: "array", items: { type: "string" }, maxItems: 3 },
              processStepDescriptions: { type: "array", items: { type: "string" }, maxItems: 3 },
              mediaPosition: { type: "string", enum: ["left", "right", "bottom"] },
            },
            required: ["scene", "type", "text", "visual", "voiceover", "duration", "eyebrow", "title", "subtitle", "description", "bullets"],
            additionalProperties: false,
          },
        },
      },
      required: ["projectName", "preset", "scenes"],
      additionalProperties: false,
    },
  });

  const sceneTypes = script.scenes?.map((scene) => scene?.type) ?? [];
  const hasProcess = marketing.brief.stepsToUse.length === 3;
  const expectedTypes = hasProcess
    ? [sceneTypes[0], "description", "feature-grid", "process", "cta-panel", "website-url"]
    : [sceneTypes[0], "description", "feature-grid", "cta-panel", "website-url"];

  if (
    !script.projectName ||
    !script.preset ||
    !Array.isArray(script.scenes) ||
    script.scenes.length !== expectedTypes.length ||
    !introSceneTypes.includes(script.scenes[0]?.type as IntroSceneType) ||
    sceneTypes.some((type, index) => type !== expectedTypes[index]) ||
    script.scenes.some((scene) => !scene || !scene.text || !scene.visual || !scene.voiceover || typeof scene.duration !== "number") ||
    script.scenes[1]?.title !== marketing.brief.slogan[0] ||
    script.scenes[1]?.subtitle !== marketing.brief.slogan[1] ||
    script.scenes[1]?.description !== marketing.brief.slogan[2] ||
    (script.scenes[2]?.bullets?.length ?? 0) !== 3 ||
    (hasProcess && (script.scenes[3]?.bullets?.length ?? 0) !== 3) ||
    (hasProcess && (script.scenes[3]?.processStepDescriptions?.length ?? 0) !== 3)
  ) {
    throw new Error("OpenAI returned an incomplete video script.");
  }

  return script as VideoScript;
}

async function requestOpenAiScenePlan(scraped: ScrapedSiteData, normalizedUrl: string): Promise<GeneratedProjectPlan> {
  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const snapshot = buildExtractedSiteSnapshot(scraped, normalizedUrl);
  const semantic = await requestOpenAiSemanticAnalysis(snapshot, model);
  const marketing = await requestOpenAiMarketingPackage(snapshot, semantic, model);
  const script = await requestOpenAiVideoScript(snapshot, semantic, marketing, model);
  return buildProjectPlanFromVideoScript(marketing, script);
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
