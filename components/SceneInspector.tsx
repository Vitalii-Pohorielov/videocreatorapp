"use client";

import { type ChangeEvent, type ReactNode } from "react";

import { fileToStoredUrl } from "@/lib/imageUpload";
import { presetLabels, sceneTypeLabels, type ExportSettings, type Scene, type TemplatePreset } from "@/store/useStore";

const presetOptions: TemplatePreset[] = [
  "clean",
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
];

type SceneInspectorProps = {
  scene: Scene;
  settings: ExportSettings;
  onUpdate: (id: string, updates: Partial<Omit<Scene, "id" | "type">>) => void;
  onUpdateSettings: (updates: Partial<ExportSettings>) => void;
};

function InspectorSection({ title, description, defaultOpen = false, children }: { title: string; description?: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{title}</p>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Open</span>
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function SceneInspector({ scene, settings, onUpdate, onUpdateSettings }: SceneInspectorProps) {
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
    onUpdate(scene.id, {
      bullets: [...scene.bullets, `New item ${scene.bullets.length + 1}`],
      bulletEmojis: [...scene.bulletEmojis, ""],
      bulletImageUrls: [...scene.bulletImageUrls, ""],
    });
  };

  const removeBulletItem = (index: number) => {
    onUpdate(scene.id, {
      bullets: scene.bullets.filter((_, itemIndex) => itemIndex !== index),
      bulletEmojis: scene.bulletEmojis.filter((_, itemIndex) => itemIndex !== index),
      bulletImageUrls: scene.bulletImageUrls.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const handleAuthorImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUpdate(scene.id, { authorImageUrl: await fileToStoredUrl(file, settings.resolution, settings.profile) });
    event.target.value = "";
  };

  const handleLogoImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUpdate(scene.id, { logoImageUrl: await fileToStoredUrl(file, settings.resolution, settings.profile) });
    event.target.value = "";
  };

  const handleWebsiteImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUpdate(scene.id, { websiteImageUrl: await fileToStoredUrl(file, settings.resolution, settings.profile) });
    event.target.value = "";
  };

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 shrink-0">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inspector</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{scene.name}</h2>
        <p className="mt-1 text-sm text-slate-500">{sceneTypeLabels[scene.type]}</p>
      </div>

      <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
        <InspectorSection title="Style preset" description="Choose the visual direction for the whole video." defaultOpen>
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              {presetOptions.map((preset) => {
                const active = settings.preset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onUpdateSettings({ preset })}
                    className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${active ? "border-sky-500 bg-sky-50 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span className="block font-medium">{presetLabels[preset]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </InspectorSection>

        <InspectorSection title="Colors" description="Edit colors separately without shifting the style grid.">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Background color</span>
              <div className="space-y-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(event) => onUpdateSettings({ backgroundColor: event.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(event) => onUpdateSettings({ backgroundColor: normalizeColorInput(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase outline-none focus:border-sky-500"
                  placeholder="#F7F4EE"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Text color</span>
              <div className="space-y-2">
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(event) => onUpdateSettings({ textColor: event.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={(event) => onUpdateSettings({ textColor: normalizeColorInput(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase outline-none focus:border-sky-500"
                  placeholder="#1B1F23"
                />
              </div>
            </label>
          </div>
        </InspectorSection>

        <InspectorSection title="Text" description="Main copy for the selected scene." defaultOpen>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Scene label</span>
              <input value={scene.name} onChange={(event) => onUpdate(scene.id, { name: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Eyebrow</span>
              <input value={scene.eyebrow} onChange={(event) => onUpdate(scene.id, { eyebrow: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Title</span>
              <textarea value={scene.title} rows={3} onChange={(event) => onUpdate(scene.id, { title: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Subtitle</span>
              <textarea value={scene.subtitle} rows={3} onChange={(event) => onUpdate(scene.id, { subtitle: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500" />
            </label>
            {scene.type === "description" ? (
              <label className="block">
                <span className="mb-2 block text-sm text-slate-600">Description</span>
                <textarea value={scene.description} rows={5} onChange={(event) => onUpdate(scene.id, { description: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500" />
              </label>
            ) : null}
          </div>
        </InspectorSection>

        {scene.type === "brand-reveal" ? (
          <InspectorSection title="Project logo" description="Upload a PNG or SVG logo for the intro scene.">
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                Upload logo
                <input type="file" accept="image/*" onChange={handleLogoImageChange} className="sr-only" />
              </label>
              {logoImageUrl ? (
                <button type="button" onClick={() => onUpdate(scene.id, { logoImageUrl: "" })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                  Remove logo
                </button>
              ) : null}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {logoImageUrl ? (
                <div className="flex h-40 items-center justify-center p-6">
                  <img src={logoImageUrl} alt="Project logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-500">No logo uploaded yet.</div>
              )}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "product-showcase" ? (
          <InspectorSection title="Highlight screenshot" description="Upload the site or product screen that should appear instead of the decorative mockup.">
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-600">Layout</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate(scene.id, { mediaPosition: "left" })}
                  className={`rounded-2xl border px-3 py-3 text-sm transition ${scene.mediaPosition === "left" ? "border-sky-500 bg-sky-50 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  Image left
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate(scene.id, { mediaPosition: "right" })}
                  className={`rounded-2xl border px-3 py-3 text-sm transition ${scene.mediaPosition === "right" ? "border-sky-500 bg-sky-50 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  Image right
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                Upload screenshot
                <input type="file" accept="image/*" onChange={handleWebsiteImageChange} className="sr-only" />
              </label>
              {websiteImageUrl ? (
                <button type="button" onClick={() => onUpdate(scene.id, { websiteImageUrl: "" })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                  Remove image
                </button>
              ) : null}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {websiteImageUrl ? (
                <img src={websiteImageUrl} alt="Highlight screenshot" className="max-h-56 w-full object-cover object-top" />
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-500">No screenshot uploaded yet.</div>
              )}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "website-scroll" ? (
          <InspectorSection title="Website screenshot" description="Upload your own site screenshot. A tall image works best for visible scrolling.">
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                Upload screenshot
                <input type="file" accept="image/*" onChange={handleWebsiteImageChange} className="sr-only" />
              </label>
              {websiteImageUrl ? (
                <button type="button" onClick={() => onUpdate(scene.id, { websiteImageUrl: "" })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                  Remove image
                </button>
              ) : null}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {websiteImageUrl ? (
                <img src={websiteImageUrl} alt="Website screenshot" className="max-h-56 w-full object-cover object-top" />
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-500">No screenshot uploaded yet.</div>
              )}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "quote" ? (
          <InspectorSection title="Author photo" description="Upload the portrait that should appear next to the quote.">
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                Upload photo
                <input type="file" accept="image/*" onChange={handleAuthorImageChange} className="sr-only" />
              </label>
              {authorImageUrl ? (
                <button type="button" onClick={() => onUpdate(scene.id, { authorImageUrl: "" })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                  Remove photo
                </button>
              ) : null}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {authorImageUrl ? (
                <div className="flex h-40 items-center justify-center p-6">
                  <img src={authorImageUrl} alt="Author portrait" className="h-28 w-28 rounded-full object-cover" />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-500">No author photo uploaded yet.</div>
              )}
            </div>
          </InspectorSection>
        ) : null}

        {scene.type === "feature-grid" || scene.type === "metrics" ? (
          <InspectorSection title="Items" description="Manage card text and markers for this scene.">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Cards</p>
                <p className="mt-1 text-sm text-slate-500">Each card can have its own text and emoji.</p>
              </div>
              <button
                type="button"
                onClick={addBulletItem}
                disabled={scene.bullets.length >= 6}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add item
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {scene.bullets.map((bullet, index) => (
                <div key={`${scene.id}-item-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-600">Text</span>
                      <input
                        value={bullet}
                        onChange={(event) => updateBullet(index, event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:bg-white"
                        placeholder="Card text"
                      />
                      <p className="mt-2 text-xs text-slate-500">Change the emoji or animated icon by clicking the marker directly in preview.</p>
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeBulletItem(index)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
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

        {scene.type === "checklist" ? (
          <InspectorSection title="Items" description="One checklist item per line.">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Items</span>
              <textarea
                value={scene.bullets.join("\n")}
                rows={6}
                onChange={(event) => onUpdate(scene.id, { bullets: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500"
                placeholder="One item per line"
              />
            </label>
          </InspectorSection>
        ) : null}

        <InspectorSection title="Timing" description="Keep scenes shorter for a faster export.">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">Duration</span>
            <input type="range" min="1.5" max="8" step="0.5" value={scene.durationSeconds} onChange={(event) => onUpdate(scene.id, { durationSeconds: Number(event.target.value) })} className="w-full accent-sky-500" />
            <p className="mt-2 text-xs text-slate-500">{scene.durationSeconds.toFixed(1)}s</p>
          </label>
        </InspectorSection>
      </div>
    </aside>
  );
}
