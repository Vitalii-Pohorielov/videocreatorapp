"use client";

import { memo, type ChangeEvent, type DragEvent, type ReactNode } from "react";

import { getFeatureAnimatedIcons } from "@/lib/animatedFeatureIcons";
import { fileToStoredUrl } from "@/lib/imageUpload";
import { isAnnouncementScene, transitionTypeLabels } from "@/lib/sceneTransitions";
import { presetLabels, sceneTypeLabels, type ExportSettings, type Scene, type TemplatePreset } from "@/store/useStore";

const presetOptions: TemplatePreset[] = [
  "black",
  "white",
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
  "acid-pop",
  "retro-print",
  "ember-glow",
];

const presetChipStyles: Record<TemplatePreset, { idle: string; active: string }> = {
  black: {
    idle: "border-slate-800 bg-slate-950 text-white hover:bg-slate-900",
    active: "border-slate-950 bg-slate-950 text-white ring-2 ring-slate-300",
  },
  white: {
    idle: "border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    active: "border-slate-900 bg-slate-50 text-slate-950 ring-2 ring-slate-300",
  },
  premium: {
    idle: "border-[#d7b98a]/45 bg-[#10233a] text-[#f8f3ea] hover:bg-[#16314f]",
    active: "border-[#e7cc9a] bg-[#16314f] text-[#fff7ec] ring-2 ring-[#d7b98a]/35",
  },
  bold: {
    idle: "border-[#ffd166]/50 bg-[#13111c] text-[#ffd166] hover:bg-[#1c1827]",
    active: "border-[#ffd166] bg-[#1c1827] text-[#ffe08f] ring-2 ring-[#ffd166]/30",
  },
  editorial: {
    idle: "border-[#c9b59b] bg-[#efe8de] text-[#181411] hover:bg-[#e8dfd2]",
    active: "border-[#9a7b4f] bg-[#e8dfd2] text-[#181411] ring-2 ring-[#9a7b4f]/20",
  },
  sunset: {
    idle: "border-[#fb923c]/40 bg-[#2a120d] text-[#ffd9b3] hover:bg-[#341710]",
    active: "border-[#fb923c] bg-[#341710] text-[#ffe6cc] ring-2 ring-[#fb923c]/25",
  },
  mono: {
    idle: "border-slate-500 bg-[#111111] text-[#f1f1f1] hover:bg-[#1a1a1a]",
    active: "border-slate-200 bg-[#1a1a1a] text-white ring-2 ring-slate-400/25",
  },
  "neon-grid": {
    idle: "border-[#39f3ff]/45 bg-[#08111f] text-[#86f7ff] hover:bg-[#0c1930]",
    active: "border-[#39f3ff] bg-[#0c1930] text-[#b6fcff] ring-2 ring-[#39f3ff]/30",
  },
  "paper-cut": {
    idle: "border-[#d95734]/30 bg-[#f3eadf] text-[#2d1f18] hover:bg-[#eee2d3]",
    active: "border-[#d95734] bg-[#eee2d3] text-[#2d1f18] ring-2 ring-[#d95734]/18",
  },
  "arctic-glass": {
    idle: "border-[#7cdcff]/40 bg-[#dff5ff] text-[#0d2236] hover:bg-[#d3f0ff]",
    active: "border-[#1479ff]/45 bg-[#d3f0ff] text-[#0d2236] ring-2 ring-[#7cdcff]/28",
  },
  brutalist: {
    idle: "border-black bg-[#f4f000] text-black hover:bg-[#fff200]",
    active: "border-black bg-[#fff200] text-black ring-2 ring-black/20",
  },
  "velvet-noir": {
    idle: "border-[#ff77aa]/35 bg-[#16070f] text-[#f7d6e6] hover:bg-[#220b16]",
    active: "border-[#ff77aa] bg-[#220b16] text-[#ffe6f0] ring-2 ring-[#ff77aa]/22",
  },
  "mint-pop": {
    idle: "border-[#19c6a3]/35 bg-[#d9fff2] text-[#053b34] hover:bg-[#cbfbea]",
    active: "border-[#19c6a3] bg-[#cbfbea] text-[#053b34] ring-2 ring-[#19c6a3]/22",
  },
  terminal: {
    idle: "border-[#2dff72]/35 bg-[#07130c] text-[#7dff9b] hover:bg-[#0b1c11]",
    active: "border-[#2dff72] bg-[#0b1c11] text-[#a8ffba] ring-2 ring-[#2dff72]/24",
  },
  blueprint: {
    idle: "border-[#7cd4ff]/35 bg-[#0f2747] text-[#d8eeff] hover:bg-[#15345d]",
    active: "border-[#7cd4ff] bg-[#15345d] text-white ring-2 ring-[#7cd4ff]/24",
  },
  "acid-pop": {
    idle: "border-[#ff4fd8]/35 bg-[#d6ff3f] text-[#161616] hover:bg-[#ddff63]",
    active: "border-[#ff4fd8] bg-[#ddff63] text-[#161616] ring-2 ring-[#ff4fd8]/20",
  },
  "retro-print": {
    idle: "border-[#c96b3b]/35 bg-[#f6dfc8] text-[#3e2418] hover:bg-[#f0d5ba]",
    active: "border-[#c96b3b] bg-[#f0d5ba] text-[#3e2418] ring-2 ring-[#c96b3b]/20",
  },
  "ember-glow": {
    idle: "border-[#ff8a4c]/35 bg-[#1b0a07] text-[#ffd9bf] hover:bg-[#27100b]",
    active: "border-[#ff8a4c] bg-[#27100b] text-[#ffe7d4] ring-2 ring-[#ff8a4c]/22",
  },
};

type SceneInspectorProps = {
  scene: Scene | null;
  settings: ExportSettings;
  isAnnouncementWorkspace: boolean;
  onUpdate: (id: string, updates: Partial<Omit<Scene, "id" | "type">>) => void;
  onUpdateSettings: (updates: Partial<ExportSettings>) => void;
  onImageUploadStart: (label: string) => void;
  onImageUploadEnd: () => void;
};

function InspectorSection({ title, description, defaultOpen = false, children }: { title: string; description?: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">{title}</p>
            {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
          </div>
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Open</span>
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export const SceneInspector = memo(function SceneInspector({
  scene,
  settings,
  isAnnouncementWorkspace,
  onUpdate,
  onUpdateSettings,
  onImageUploadStart,
  onImageUploadEnd,
}: SceneInspectorProps) {
  const fieldClassName =
    "w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400";
  const textareaClassName =
    "w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400";
  const ghostButtonClassName =
    "rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.1]";
  const panelClassName = "mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70";
  const labelClassName = "mb-2 block text-sm text-slate-400";

  if (!scene) {
    return (
      <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.35)] backdrop-blur">
        <div className="mb-4 shrink-0">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inspector</p>
          <h2 className="mt-1 text-lg font-semibold text-white">No scene selected</h2>
          <p className="mt-1 text-sm text-slate-400">Announcement videos can start from a blank editor.</p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
          <div>
            <p className="text-sm font-medium text-white">Add your first scene to begin editing.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Use the + button in the timeline to pick a scene type, then the scene controls will appear here.</p>
          </div>
        </div>
      </aside>
    );
  }

  const normalizeColorInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  };

  const normalizePreviewImageUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "." || trimmed === "/") return "";
    if (/^https?:\/\/[^/]+\/\.?$/.test(trimmed)) return "";
    return trimmed;
  };

  const logoImageUrl = normalizePreviewImageUrl(scene.logoImageUrl);
  const websiteImageUrl = normalizePreviewImageUrl(scene.websiteImageUrl);
  const authorImageUrl = normalizePreviewImageUrl(scene.authorImageUrl);

  const updateBullet = (index: number, value: string) => {
    const bullets = [...scene.bullets];
    bullets[index] = value;
    onUpdate(scene.id, { bullets });
  };

  const addBulletItem = () => {
    if (scene.bullets.length >= 6) return;
    const nextDefaultIcon = getFeatureAnimatedIcons(scene.bullets.length + 1)[scene.bullets.length];
    onUpdate(scene.id, {
      bullets: [...scene.bullets, `New item ${scene.bullets.length + 1}`],
      bulletEmojis: [...scene.bulletEmojis, nextDefaultIcon?.fallbackEmoji ?? ""],
      bulletImageUrls: [...scene.bulletImageUrls, nextDefaultIcon?.imageUrl ?? ""],
    });
  };

  const removeBulletItem = (index: number) => {
    onUpdate(scene.id, {
      bullets: scene.bullets.filter((_, itemIndex) => itemIndex !== index),
      bulletEmojis: scene.bulletEmojis.filter((_, itemIndex) => itemIndex !== index),
      bulletImageUrls: scene.bulletImageUrls.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const normalizeFixedBullets = (value: string, count: number) => {
    const lines = value.split("\n").map((item) => item.trim());
    return Array.from({ length: count }, (_, index) => lines[index] ?? "");
  };

  const handleAuthorImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onImageUploadStart("Uploading author media...");
    try {
      onUpdate(scene.id, { authorImageUrl: await fileToStoredUrl(file, settings.resolution, settings.profile) });
    } finally {
      onImageUploadEnd();
    }
    event.target.value = "";
  };

  const handleLogoImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onImageUploadStart("Uploading logo...");
    try {
      onUpdate(scene.id, { logoImageUrl: await fileToStoredUrl(file, settings.resolution, settings.profile) });
    } finally {
      onImageUploadEnd();
    }
    event.target.value = "";
  };

  const handleWebsiteImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onImageUploadStart("Uploading screenshot...");
    try {
      onUpdate(scene.id, { websiteImageUrl: await fileToStoredUrl(file, settings.resolution, settings.profile) });
    } finally {
      onImageUploadEnd();
    }
    event.target.value = "";
  };

  const handleAnnouncementProjectImageChange =
    (index: number) =>
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      onImageUploadStart(`Uploading project image ${index + 1}...`);
      try {
        const projectImageUrls = Array.from({ length: scene.projectCount ?? 8 }, (_, itemIndex) => scene.projectImageUrls?.[itemIndex] ?? "");
        projectImageUrls[index] = await fileToStoredUrl(file, settings.resolution, settings.profile);
        onUpdate(scene.id, { projectImageUrls });
      } finally {
        onImageUploadEnd();
      }
      event.target.value = "";
    };

  const handleAnnouncementProjectBatchUpload = async (files: FileList | File[]) => {
    const nextFiles = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 25);
    if (nextFiles.length === 0) return;

    const targetCount = Math.min(25, Math.max(scene.projectCount ?? 8, nextFiles.length));
    onImageUploadStart(`Uploading ${nextFiles.length} project images...`);
    try {
      const uploadedUrls = await Promise.all(nextFiles.map((file) => fileToStoredUrl(file, settings.resolution, settings.profile)));
      const projectImageUrls = Array.from({ length: targetCount }, (_, itemIndex) => uploadedUrls[itemIndex] ?? scene.projectImageUrls?.[itemIndex] ?? "");
      onUpdate(scene.id, { projectCount: targetCount, projectImageUrls });
    } finally {
      onImageUploadEnd();
    }
  };

  const handleAnnouncementProjectDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!event.dataTransfer.files?.length) return;
    await handleAnnouncementProjectBatchUpload(event.dataTransfer.files);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="mb-4 shrink-0">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inspector</p>
        <h2 className="mt-1 text-lg font-semibold text-white">{scene.name}</h2>
        <p className="mt-1 text-sm text-slate-400">{sceneTypeLabels[scene.type]}</p>
      </div>

      <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
        {!isAnnouncementWorkspace ? (
          <InspectorSection title="Style preset" description="Choose the visual direction for the whole video." defaultOpen>
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                {presetOptions.map((preset) => {
                  const active = settings.preset === preset;
                  const tone = presetChipStyles[preset];
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onUpdateSettings({ preset })}
                      className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${active ? tone.active : tone.idle}`}
                    >
                      <span className="block font-medium">{presetLabels[preset]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </InspectorSection>
        ) : null}

        {!isAnnouncementWorkspace ? (
          <InspectorSection title="Colors" description="Edit colors separately without shifting the style grid.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClassName}>Background</span>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(event) => onUpdateSettings({ backgroundColor: event.target.value })}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/80 p-2"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(event) => onUpdateSettings({ backgroundColor: normalizeColorInput(event.target.value) })}
                    className={`${fieldClassName} uppercase`}
                    placeholder="#F7F4EE"
                  />
                </div>
              </label>
              <label className="block">
                <span className={labelClassName}>Text</span>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={settings.textColor}
                    onChange={(event) => onUpdateSettings({ textColor: event.target.value })}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/80 p-2"
                  />
                  <input
                    type="text"
                    value={settings.textColor}
                    onChange={(event) => onUpdateSettings({ textColor: normalizeColorInput(event.target.value) })}
                    className={`${fieldClassName} uppercase`}
                    placeholder="#1B1F23"
                  />
                </div>
              </label>
            </div>
          </InspectorSection>
        ) : null}

        {!isAnnouncementWorkspace ? (
          <InspectorSection title="Text" description="Main copy for the selected scene." defaultOpen>
            <div className="space-y-4">
              <label className="block">
                <span className={labelClassName}>Scene label</span>
                <input value={scene.name} onChange={(event) => onUpdate(scene.id, { name: event.target.value })} className={fieldClassName} />
              </label>
              <label className="block">
                <span className={labelClassName}>{scene.type === "description" ? "Line 1" : scene.type === "website-url" ? "Website address" : scene.type === "announcement-hero" ? "Main title" : "Title"}</span>
                <textarea value={scene.title} rows={3} onChange={(event) => onUpdate(scene.id, { title: event.target.value })} className={textareaClassName} />
              </label>
              {scene.type !== "website-url" && scene.type !== "announcement-hero" ? (
                <label className="block">
                  <span className={labelClassName}>{scene.type === "description" ? "Line 2" : scene.type === "split-slogan" ? "Project name" : "Subtitle"}</span>
                  <textarea value={scene.subtitle} rows={3} onChange={(event) => onUpdate(scene.id, { subtitle: event.target.value })} className={textareaClassName} />
                </label>
              ) : null}
              {scene.type === "description" ? (
                <label className="block">
                  <span className={labelClassName}>Line 3</span>
                  <textarea value={scene.description} rows={5} onChange={(event) => onUpdate(scene.id, { description: event.target.value })} className={textareaClassName} />
                </label>
              ) : null}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "code-preview" ? (
          <InspectorSection title="Code" description="Edit the snippet shown in the code card." defaultOpen>
            <label className="block">
              <span className={labelClassName}>Snippet</span>
              <textarea
                value={scene.code ?? scene.description}
                rows={12}
                onChange={(event) => onUpdate(scene.id, { code: event.target.value, description: event.target.value })}
                className={`${textareaClassName} font-mono text-[13px] leading-6`}
                placeholder="Paste code here"
                wrap="off"
                spellCheck={false}
              />
            </label>
          </InspectorSection>
        ) : null}

        {scene.type === "brand-reveal" ? (
          <InspectorSection title="Project logo" description="Upload a PNG or SVG logo for the intro scene.">
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className={`inline-flex cursor-pointer font-medium ${ghostButtonClassName}`}>
                Upload logo
                <input type="file" accept="image/*" onChange={handleLogoImageChange} className="sr-only" />
              </label>
              {logoImageUrl ? (
                <button type="button" onClick={() => onUpdate(scene.id, { logoImageUrl: "" })} className={ghostButtonClassName}>
                  Remove logo
                </button>
              ) : null}
            </div>
            <div className={panelClassName}>
              {logoImageUrl ? (
                <div className="flex h-40 items-center justify-center p-6">
                  <img src={logoImageUrl} alt="Project logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-400">No logo uploaded yet.</div>
              )}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "announcement-hero" ? (
          <InspectorSection title="Project wall" description="Choose how many project logos appear behind the main announcement title.">
            <label className="block">
              <span className={labelClassName}>Top line</span>
              <input
                value={scene.eyebrow}
                onChange={(event) => onUpdate(scene.id, { eyebrow: event.target.value })}
                className={fieldClassName}
                placeholder="This week on"
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Projects in background</span>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={scene.projectCount ?? 8}
                onChange={(event) => onUpdate(scene.id, { projectCount: Number(event.target.value) })}
                className="w-full accent-sky-500"
              />
              <p className="mt-2 text-xs text-slate-500">{scene.projectCount ?? 8} project logos</p>
            </label>
            <label
              className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center transition hover:border-sky-400/40 hover:bg-white/[0.06]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => void handleAnnouncementProjectDrop(event)}
            >
              <span className="text-sm font-medium text-white">Drop multiple logos here</span>
              <span className="mt-2 text-sm leading-6 text-slate-400">Drop or choose up to 25 images and the editor will place them into the announcement layout automatically.</span>
              <span className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200">Choose images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  if (!event.target.files?.length) return;
                  void handleAnnouncementProjectBatchUpload(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            <div className="mt-4 grid gap-3 grid-cols-1">
              {Array.from({ length: scene.projectCount ?? 8 }, (_, index) => {
                const imageUrl = scene.projectImageUrls?.[index] ?? "";
                return (
                  <div key={`${scene.id}-project-image-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Project {index + 1}</p>
                        <p className="mt-1 text-xs text-slate-500">Upload a logo or mockup tile for this slot.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className={`inline-flex cursor-pointer font-medium ${ghostButtonClassName}`}>
                          Upload
                          <input type="file" accept="image/*" onChange={handleAnnouncementProjectImageChange(index)} className="sr-only" />
                        </label>
                        {imageUrl ? (
                          <button type="button" onClick={() => onUpdate(scene.id, { projectImageUrls: (scene.projectImageUrls ?? []).map((item, itemIndex) => (itemIndex === index ? "" : item)) })} className={ghostButtonClassName}>
                            Clear
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className={panelClassName}>
                      {imageUrl ? (
                        <div className="flex aspect-square items-center justify-center p-3">
                          <img src={imageUrl} alt={`Project ${index + 1}`} className="h-full w-full rounded-2xl object-contain" />
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center px-4 text-center text-sm text-slate-400">No image uploaded for this project yet.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "product-showcase" ? (
          <InspectorSection title="Highlight screenshot" description="Upload the site or product screen that should appear instead of the decorative mockup.">
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-400">Layout</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate(scene.id, { mediaPosition: "left" })}
                  className={`rounded-2xl border px-3 py-3 text-sm transition ${scene.mediaPosition === "left" ? "border-sky-400 bg-sky-400/12 text-sky-200" : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"}`}
                >
                  Image left
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate(scene.id, { mediaPosition: "right" })}
                  className={`rounded-2xl border px-3 py-3 text-sm transition ${scene.mediaPosition === "right" ? "border-sky-400 bg-sky-400/12 text-sky-200" : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"}`}
                >
                  Image right
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate(scene.id, { mediaPosition: "bottom" })}
                  className={`rounded-2xl border px-3 py-3 text-sm transition ${scene.mediaPosition === "bottom" ? "border-sky-400 bg-sky-400/12 text-sky-200" : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"}`}
                >
                  Image bottom
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className={`inline-flex cursor-pointer font-medium ${ghostButtonClassName}`}>
                Upload screenshot
                <input type="file" accept="image/*" onChange={handleWebsiteImageChange} className="sr-only" />
              </label>
              {websiteImageUrl ? (
                <button type="button" onClick={() => onUpdate(scene.id, { websiteImageUrl: "" })} className={ghostButtonClassName}>
                  Remove image
                </button>
              ) : null}
            </div>
            <div className={panelClassName}>
              {websiteImageUrl ? (
                <img src={websiteImageUrl} alt="Highlight screenshot" className="max-h-56 w-full object-cover object-top" />
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-400">No screenshot uploaded yet.</div>
              )}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "website-scroll" ? (
          <InspectorSection title="Website screenshot" description="Upload your own site screenshot. A tall image works best for visible scrolling.">
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className={`inline-flex cursor-pointer font-medium ${ghostButtonClassName}`}>
                Upload screenshot
                <input type="file" accept="image/*" onChange={handleWebsiteImageChange} className="sr-only" />
              </label>
              {websiteImageUrl ? (
                <button type="button" onClick={() => onUpdate(scene.id, { websiteImageUrl: "" })} className={ghostButtonClassName}>
                  Remove image
                </button>
              ) : null}
            </div>
            <div className={panelClassName}>
              {websiteImageUrl ? (
                <img src={websiteImageUrl} alt="Website screenshot" className="max-h-56 w-full object-cover object-top" />
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-400">No screenshot uploaded yet.</div>
              )}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "quote" ? (
          <InspectorSection title="Author media" description="Upload a photo or logo that should appear next to the quote.">
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className={`inline-flex cursor-pointer font-medium ${ghostButtonClassName}`}>
                Upload photo or logo
                <input type="file" accept="image/*" onChange={handleAuthorImageChange} className="sr-only" />
              </label>
              {authorImageUrl ? (
                <button type="button" onClick={() => onUpdate(scene.id, { authorImageUrl: "" })} className={ghostButtonClassName}>
                  Remove media
                </button>
              ) : null}
            </div>
            <div className={panelClassName}>
              {authorImageUrl ? (
                <div className="flex h-40 items-center justify-center p-6">
                  <img src={authorImageUrl} alt="Author photo or logo" className="h-28 w-28 rounded-full object-cover" />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-400">No author photo or logo uploaded yet.</div>
              )}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "feature-grid" ? (
          <InspectorSection title="Items" description="Manage card text and markers for this scene.">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Cards</p>
                <p className="mt-1 text-sm text-slate-400">Each card can have its own text and emoji.</p>
              </div>
              <button
                type="button"
                onClick={addBulletItem}
                disabled={scene.bullets.length >= 6}
                className={`${ghostButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Add item
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {scene.bullets.map((bullet, index) => (
                <div key={`${scene.id}-item-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <label className="block">
                      <span className={labelClassName}>Text</span>
                      <input
                        value={bullet}
                        onChange={(event) => updateBullet(index, event.target.value)}
                        className={fieldClassName}
                        placeholder="Card text"
                      />
                      <p className="mt-2 text-xs text-slate-500">Change the emoji or animated icon by clicking the marker directly in preview.</p>
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeBulletItem(index)}
                        className={ghostButtonClassName}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "pricing" ? (
          <InspectorSection title="Plans" description="Edit plan names, prices, and descriptions separately.">
            <label className="block">
              <span className={labelClassName}>Prices</span>
              <textarea
                value={scene.bullets.join("\n")}
                rows={3}
                onChange={(event) => onUpdate(scene.id, { bullets: normalizeFixedBullets(event.target.value, 3) })}
                className={textareaClassName}
                placeholder="$19"
              />
            </label>
            <label className="block mt-4">
              <span className={labelClassName}>Plan names</span>
              <textarea
                value={(scene.pricingPlanTitles ?? []).join("\n")}
                rows={3}
                onChange={(event) => onUpdate(scene.id, { pricingPlanTitles: normalizeFixedBullets(event.target.value, 3) })}
                className={textareaClassName}
                placeholder="Starter"
              />
            </label>
            <label className="block mt-4">
              <span className={labelClassName}>Descriptions</span>
              <textarea
                value={(scene.pricingPlanDescriptions ?? []).join("\n")}
                rows={3}
                onChange={(event) => onUpdate(scene.id, { pricingPlanDescriptions: normalizeFixedBullets(event.target.value, 3) })}
                className={textareaClassName}
                placeholder="Great for small launches and demos."
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">This pricing scene keeps 3 plans.</p>
          </InspectorSection>
        ) : null}

        {scene.type === "center-text" ? (
          <InspectorSection title="Copy" description="Centered message with a short supporting line.">
            <label className="block">
              <span className={labelClassName}>Title</span>
              <input
                value={scene.title}
                onChange={(event) => onUpdate(scene.id, { title: event.target.value })}
                className={fieldClassName}
                placeholder="Bring the message to the center"
              />
            </label>
          </InspectorSection>
        ) : null}

        {scene.type === "process" ? (
          <InspectorSection title="Steps" description="One process step per line.">
            <label className="block">
              <span className={labelClassName}>Steps</span>
              <textarea
                value={scene.bullets.join("\n")}
                rows={3}
                onChange={(event) => onUpdate(scene.id, { bullets: normalizeFixedBullets(event.target.value, 3) })}
                className={textareaClassName}
                placeholder="Plan"
              />
              <p className="mt-2 text-xs text-slate-500">This process scene keeps 3 steps.</p>
            </label>
            <label className="block mt-4">
              <span className={labelClassName}>Descriptions</span>
              <textarea
                value={(scene.processStepDescriptions ?? []).join("\n")}
                rows={3}
                onChange={(event) => onUpdate(scene.id, { processStepDescriptions: normalizeFixedBullets(event.target.value, 3) })}
                className={textareaClassName}
                placeholder="Set the direction."
              />
            </label>
          </InspectorSection>
        ) : null}

        <InspectorSection title="Timing" description="Keep scenes shorter for a faster export.">
          <label className="block">
            <span className={labelClassName}>Duration</span>
            <input type="range" min="1.5" max="8" step="0.5" value={scene.durationSeconds} onChange={(event) => onUpdate(scene.id, { durationSeconds: Number(event.target.value) })} className="w-full accent-sky-500" />
            <p className="mt-2 text-xs text-slate-500">{scene.durationSeconds.toFixed(1)}s</p>
          </label>
          {isAnnouncementScene(scene) ? (
            <label className="mt-4 block">
              <span className={labelClassName}>Scene transition</span>
              <select
                value={scene.transition}
                onChange={(event) => onUpdate(scene.id, { transition: event.target.value as Scene["transition"] })}
                className={fieldClassName}
              >
                {Object.entries(transitionTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </InspectorSection>
      </div>
    </aside>
  );
});
