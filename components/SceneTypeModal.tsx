"use client";

import { usePremiumStatus } from "@/lib/usePremiumStatus";
import { freePromoSceneTypes, sceneDefinitions, type SceneType } from "@/store/useStore";

type SceneTypeModalProps = {
  isOpen: boolean;
  isAnnouncementWorkspace: boolean;
  onClose: () => void;
  onSelect: (type: SceneType) => void;
};

export function SceneTypeModal({ isOpen, isAnnouncementWorkspace, onClose, onSelect }: SceneTypeModalProps) {
  const { isPremium } = usePremiumStatus();

  if (!isOpen) return null;

  const filteredSceneDefinitions = sceneDefinitions.filter((definition) => {
    if (definition.type === "slogan") return false;
    if (isAnnouncementWorkspace) return definition.type === "announcement-hero" || definition.type === "split-slogan";
    return definition.type !== "announcement-hero" && definition.type !== "split-slogan";
  });

  const freeSceneDefinitions = filteredSceneDefinitions.filter((definition) => freePromoSceneTypes.includes(definition.type));
  const premiumSceneDefinitions = filteredSceneDefinitions.filter((definition) => !freePromoSceneTypes.includes(definition.type));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_30px_90px_rgba(2,6,23,0.7)]">
        <div className="mb-0 flex items-start justify-between gap-4 border-b border-white/10 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Add scene</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Choose scene type</h2>
            <p className="mt-2 text-sm text-slate-400">
              {isPremium ? "Add a new block to the single scene track. New scene types can plug into this catalog later." : "Free mode supports Intro Fade, Highlight, and Features scenes only."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.08]">
            Close
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {!isAnnouncementWorkspace ? (
            <section>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Free</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {freeSceneDefinitions.map((definition) => (
                  <button
                    key={definition.type}
                    type="button"
                    onClick={() => onSelect(definition.type)}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-sky-400/35 hover:bg-white/[0.07]"
                  >
                    <h3 className="text-lg font-semibold text-white">{definition.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{definition.catalogDescription}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">{isAnnouncementWorkspace ? "Scenes" : "Premium"}</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(isAnnouncementWorkspace ? filteredSceneDefinitions : premiumSceneDefinitions).map((definition) => {
                const isLocked = !isAnnouncementWorkspace && !isPremium;
                return (
                  <button
                    key={definition.type}
                    disabled={isLocked}
                    aria-disabled={isLocked}
                    type="button"
                    onClick={() => onSelect(definition.type)}
                    className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-sky-400/35 hover:bg-white/[0.07] ${
                      isLocked ? "cursor-not-allowed opacity-40 saturate-[0.65]" : ""
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-white">{definition.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{definition.catalogDescription}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
}
