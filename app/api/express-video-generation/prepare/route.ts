import { NextResponse } from "next/server";

import { generateProjectFromUrl } from "@/lib/siteGenerator";
import { remoteImageToDataUrl } from "@/lib/remoteImageDataUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function getProjectLogo(project: Awaited<ReturnType<typeof generateProjectFromUrl>>) {
  return project.sceneTrack.scenes.find((scene) => scene.logoImageUrl)?.logoImageUrl ?? "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const sourceUrl = (body.url ?? "").trim();

    if (!sourceUrl) {
      return NextResponse.json({ error: "Add a website URL first." }, { status: 400 });
    }

    const project = await generateProjectFromUrl(sourceUrl);
    const logoImageUrl = getProjectLogo(project);
    const exportLogoImageUrl = logoImageUrl
      ? await remoteImageToDataUrl(logoImageUrl).catch(() => logoImageUrl)
      : "";
    const sceneTrack = {
      ...project.sceneTrack,
      scenes: project.sceneTrack.scenes.map((scene) =>
        scene.logoImageUrl === logoImageUrl && exportLogoImageUrl !== logoImageUrl
          ? { ...scene, logoImageUrl: exportLogoImageUrl }
          : scene,
      ),
    };

    return NextResponse.json({
      sourceUrl,
      projectName: project.projectName,
      slogan: project.slogan,
      logoImageUrl: exportLogoImageUrl,
      sceneTrack,
      exportSettings: project.exportSettings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare that website.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
