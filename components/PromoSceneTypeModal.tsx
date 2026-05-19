"use client";

import { usePremiumStatus } from "@/lib/usePremiumStatus";
import { freePromoSceneTypes, sceneDefinitions, type SceneType } from "@/store/useStore";

type PromoSceneTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: SceneType) => void;
};

const promoSceneGroups: Array<{ label: string; types: SceneType[] }> = [
  { label: "Free", types: ["brand-reveal", "product-showcase", "feature-grid"] },
  { label: "Content", types: ["code-preview", "description", "pricing", "process", "center-text", "website-url", "website-scroll", "quote", "cta"] },
];

type SceneDefinitionItem = (typeof sceneDefinitions)[number];

export function PromoSceneTypeModal({ isOpen, onClose, onSelect }: PromoSceneTypeModalProps) {
  const { isPremium } = usePremiumStatus();

  if (!isOpen) return null;

  const definitionMap = new Map(
    sceneDefinitions
      .filter((definition) => !["announcement-hero", "split-slogan", "brand-reveal-alt", "brand-reveal-circle", "code-review", "pricing-peek", "website-scroll-front", "cta-panel"].includes(definition.type))
      .map((definition) => [definition.type, definition] as const),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_30px_90px_rgba(2,6,23,0.7)]">
        <div className="mb-0 flex items-start justify-between gap-4 border-b border-white/10 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Add scene</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Choose scene type</h2>
            <p className="mt-2 text-sm text-slate-400">
              {isPremium ? "Add a new block to the promo video flow." : "Free mode supports Intro Fade, Highlight, and Features scenes only."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.08]">
            Close
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {promoSceneGroups.map((group) => {
              const definitions = group.types
                .map((type) => definitionMap.get(type))
                .filter((definition): definition is SceneDefinitionItem => Boolean(definition));
              if (definitions.length === 0) return null;

              return (
                <section key={group.label}>
                  <p className="mb-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${group.label === "Free" ? "border border-slate-300/20 bg-slate-300/10 text-slate-200" : "text-slate-500"}`}>
                      {group.label}
                    </span>
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {definitions.map((definition) => {
                      const isLocked = !isPremium && !freePromoSceneTypes.includes(definition.type);
                      return (
                        <button
                          key={definition.type}
                          type="button"
                          disabled={isLocked}
                          aria-disabled={isLocked}
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
