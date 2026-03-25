"use server";

import { createScene, presetDefaults, type ExportSettings, type Scene, type SceneTrack, type TemplatePreset } from "@/lib/sceneDefinitions";

type ScrapedSiteData = {
  sourceUrl: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  bullets: string[];
  cta: string[];
  ogImageUrl: string;
};

type GeneratedProjectPayload = {
  projectName: string;
  sceneTrack: SceneTrack;
  exportSettings: ExportSettings;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

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
    ogImageUrl,
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

function toShortLine(value: string, fallback: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return (normalized || fallback).slice(0, maxLength);
}

function withDuration(scene: Scene, durationSeconds = 3) {
  return { ...scene, durationSeconds };
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
  const projectName = scraped.title || getDomainLabel(normalizedUrl);
  const heroTitle = scraped.headings[0] || scraped.title || projectName;
  const heroSubtitle = scraped.description || scraped.headings[1] || `Explore ${projectName}.`;
  const featureBullets = takeBullets(scraped.bullets.length ? scraped.bullets : scraped.headings.slice(1), 3);
  const ctaLine = scraped.cta[0] || `Visit ${projectName}`;
  const supportingParagraph = scraped.paragraphs[0] || scraped.description;
  const normalizedDomain = normalizedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const descriptionLine1 = toShortLine(scraped.headings[1] || heroTitle, "Built for modern teams", 48);
  const descriptionLine2 = toShortLine(scraped.headings[2] || scraped.description || heroSubtitle, "Clear product communication", 56);
  const descriptionLine3 = toShortLine(scraped.headings[3] || supportingParagraph || `Explore ${projectName}`, "Fast demos and exports", 56);
  const middleSceneType = randomChoice<"product-showcase" | "feature-grid">(["product-showcase", "feature-grid"]);
  const finalSceneType = randomChoice<"cta" | "website-url">(["cta", "website-url"]);
  const preset = randomChoice(generatedPresets);
  const presetColors = presetDefaults[preset];

  const scenes: Scene[] = [];

  scenes.push(
    withDuration(
      applyScene(createScene("brand-reveal", scenes.length), {
        name: "Intro 1",
        eyebrow: getDomainLabel(normalizedUrl),
        title: projectName,
        subtitle: heroSubtitle.slice(0, 110),
      }),
    ),
  );

  scenes.push(
    withDuration(
      applyScene(createScene("description", scenes.length), {
        name: "Description 1",
        eyebrow: "Overview",
        title: descriptionLine1,
        subtitle: descriptionLine2,
        description: descriptionLine3,
      }),
    ),
  );

  if (middleSceneType === "product-showcase") {
    scenes.push(
      withDuration(
        applyScene(createScene("product-showcase", scenes.length), {
          name: "Highlight 1",
          eyebrow: "Highlight",
          title: heroTitle.slice(0, 90),
          subtitle: heroSubtitle.slice(0, 120),
          websiteImageUrl: scraped.ogImageUrl,
        }),
      ),
    );
  } else {
    const generatedBullets = featureBullets.length > 0 ? featureBullets : takeBullets([scraped.headings[1] || "", scraped.headings[2] || "", heroSubtitle], 3);
    scenes.push(
      withDuration(
        applyScene(createScene("feature-grid", scenes.length), {
          name: "Features 1",
          eyebrow: "Highlights",
          title: `Why ${projectName} stands out`,
          bullets: generatedBullets,
          bulletEmojis: generatedBullets.map(() => ""),
          bulletImageUrls: generatedBullets.map(() => ""),
        }),
      ),
    );
  }

  scenes.push(
    withDuration(
      finalSceneType === "cta"
        ? applyScene(createScene("cta", scenes.length), {
            name: "CTA 1",
            eyebrow: "Next step",
            title: ctaLine.slice(0, 90),
            subtitle: normalizedDomain,
          })
        : applyScene(createScene("website-url", scenes.length), {
            name: "URL 1",
            eyebrow: "Website",
            title: normalizedDomain.toLowerCase(),
            subtitle: "",
          }),
    ),
  );

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
      preset,
      resolution: "720p",
      profile: "standard",
    },
  };
}
