"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";

import { bannerStylePresets, type BannerStylePresetId } from "@/lib/bannerStylePresets";

type BannerStylesModalProps = {
  isOpen: boolean;
  activePresetId: BannerStylePresetId;
  onClose: () => void;
  onApplyPreset: (presetId: BannerStylePresetId) => void;
};

function StylePreview({ presetId }: { presetId: BannerStylePresetId }) {
  switch (presetId) {
    case "aurora-burst":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_top,#3182ff_0%,#102f63_40%,#07111f_100%)]">
          <div className="absolute left-5 top-5 z-20 max-w-[52%] rounded-[20px] border border-white/15 bg-black/20 px-3 py-3 backdrop-blur-md">
            <div className="text-[18px] font-black uppercase leading-[0.9] tracking-[-0.06em] text-white">Aurora</div>
          </div>
          <div className="absolute right-3 top-3 h-[78%] w-[48%] overflow-hidden rounded-[34px] border border-white/20">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(2,6,23,0.3)),radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.28),transparent_38%)]" />
          </div>
          <div className="absolute bottom-4 left-4 h-10 w-10 rounded-full bg-white/10" />
          <div className="absolute bottom-6 right-[52%] h-8 w-8 rounded-full bg-white/10" />
        </div>
      );
    case "sunrise-editorial":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[#f1e8da]">
          <div className="absolute left-4 top-4 z-20 rounded-[20px] bg-white/62 px-3 py-2 text-[18px] font-bold uppercase tracking-[-0.05em] text-[#1f1915] backdrop-blur-md">
            Editorial
          </div>
          <div className="absolute left-4 top-14 h-[70%] w-[48%] overflow-hidden rounded-[30px] shadow-[0_20px_54px_rgba(0,0,0,0.16)]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.05),rgba(2,6,23,0.24))]" />
          </div>
          <div className="absolute right-4 top-16 z-20 max-w-[42%] rounded-[26px] bg-white/70 px-4 py-4 text-right backdrop-blur-md">
            <div className="text-[16px] font-bold uppercase leading-[0.92] tracking-[-0.05em] text-[#1f1915]">Story</div>
          </div>
          <div className="absolute bottom-4 right-5 h-12 w-12 rounded-full bg-[#c65a2d]/20" />
        </div>
      );
    case "midnight-luxe":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_top_right,#f5c542_0%,#0b0c10_26%,#040509_100%)]">
          <div className="absolute left-4 top-4 z-20 rounded-[18px] border border-amber-300/20 bg-black/35 px-3 py-2 text-[16px] font-black uppercase tracking-[-0.06em] text-amber-200 backdrop-blur-md">
            Luxe
          </div>
          <div className="absolute left-4 top-14 h-[72%] w-[44%] overflow-hidden rounded-[32px] border border-amber-200/20 bg-black/35" />
          <div className="absolute right-4 top-8 z-20 max-w-[44%] rounded-[26px] bg-black/42 px-4 py-4 text-right backdrop-blur-md">
            <div className="text-[18px] font-black uppercase leading-[0.92] tracking-[-0.06em] text-amber-200">Premium</div>
          </div>
          <div className="absolute bottom-4 right-4 h-10 w-10 rounded-full border border-amber-300/55 bg-amber-300/12" />
        </div>
      );
    case "clean-poster":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[#f7f5ef]">
          <div className="absolute inset-x-4 top-4 h-px bg-black/10" />
          <div className="absolute left-4 top-6 z-20 rounded-[18px] bg-white/78 px-3 py-2 text-[16px] font-black uppercase tracking-[-0.06em] text-black">
            Poster
          </div>
          <div className="absolute left-4 top-14 h-[68%] w-[50%] overflow-hidden rounded-[26px] bg-black/10 shadow-[0_18px_42px_rgba(0,0,0,0.12)]" />
          <div className="absolute right-4 bottom-6 z-20 rounded-[22px] bg-white/70 px-3 py-2 text-[14px] font-black uppercase tracking-[-0.04em] text-black">
            Clean
          </div>
        </div>
      );
    case "fresh-gradient":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#0b4ef0_0%,#0cc0b8_60%,#39d98a_100%)]">
          <div className="absolute left-4 top-4 z-20 rounded-[18px] bg-black/24 px-3 py-2 text-[16px] font-black uppercase tracking-[-0.06em] text-white backdrop-blur-md">
            Gradient
          </div>
          <div className="absolute right-4 bottom-5 h-[56%] w-[36%] rounded-[42px] bg-[radial-gradient(circle_at_35%_30%,#d8f4ff_0%,#86cdf8_36%,#2b7cbf_68%,#0b4ef0_100%)]" />
          <div className="absolute left-5 top-1/2 z-20 max-w-[44%] -translate-y-1/2 rounded-[22px] bg-black/22 px-4 py-4 text-white backdrop-blur-md">
            <div className="text-[16px] font-black uppercase leading-[0.92] tracking-[-0.05em]">Fresh</div>
          </div>
        </div>
      );
    case "frame-strip":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[#0f172a]">
          <div className="absolute left-3 top-3 h-[78%] w-[38%] overflow-hidden rounded-[24px] bg-white/10" />
          <div className="absolute right-3 top-3 z-20 w-[52%] rounded-[24px] bg-white/8 px-4 py-4 backdrop-blur-md">
            <div className="text-[17px] font-black uppercase leading-[0.92] tracking-[-0.06em] text-white">Frame</div>
          </div>
          <div className="absolute right-3 bottom-3 h-12 w-[52%] rounded-[18px] bg-sky-400/20" />
        </div>
      );
    case "circle-badge":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[#111827]">
          <div className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
          <div className="absolute left-4 top-4 z-20 rounded-full bg-black/35 px-3 py-2 text-[14px] font-black uppercase tracking-[-0.06em] text-white backdrop-blur-md">
            Circle
          </div>
          <div className="absolute left-4 bottom-4 z-20 max-w-[54%] rounded-[22px] bg-white/10 px-4 py-3 text-white backdrop-blur-md">
            <div className="text-[15px] font-black uppercase leading-[0.92] tracking-[-0.05em]">Badge</div>
          </div>
        </div>
      );
    case "brutal-grid":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[#050505]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />
          <div className="absolute left-3 top-3 z-20 rounded-[10px] bg-white px-3 py-2 text-[14px] font-black uppercase tracking-[-0.06em] text-black">
            Brutal
          </div>
          <div className="absolute right-3 top-3 h-[72%] w-[42%] bg-white/10" />
          <div className="absolute left-4 bottom-4 z-20 rounded-[12px] bg-white/10 px-3 py-2 text-[14px] font-black uppercase tracking-[-0.04em] text-white">
            Grid
          </div>
        </div>
      );
    case "slab-cut":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[#f8fafc]">
          <div className="absolute right-0 top-0 h-full w-[42%] bg-black/10" />
          <div className="absolute left-3 top-3 h-[78%] w-[44%] rounded-[24px] bg-black/10" />
          <div className="absolute right-4 top-4 z-20 rounded-[18px] bg-black px-3 py-2 text-[14px] font-black uppercase tracking-[-0.06em] text-white">
            Slab
          </div>
          <div className="absolute left-4 bottom-4 z-20 max-w-[46%] rounded-[20px] bg-white px-4 py-3 text-black">
            <div className="text-[15px] font-black uppercase leading-[0.92] tracking-[-0.05em]">Cut</div>
          </div>
        </div>
      );
    case "glass-label":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[#0b1220]">
          <div className="absolute left-3 top-3 h-[80%] w-[52%] rounded-[24px] bg-white/10" />
          <div className="absolute right-3 top-5 z-20 w-[44%] rounded-[22px] border border-white/12 bg-white/10 px-3 py-3 backdrop-blur-md">
            <div className="text-[14px] font-black uppercase tracking-[-0.06em] text-white">Glass</div>
          </div>
          <div className="absolute right-3 bottom-3 z-20 w-[44%] rounded-[18px] bg-black/24 px-3 py-2 text-white backdrop-blur-md">
            Label
          </div>
        </div>
      );
    case "poster-burst":
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[#fffaf2]">
          <div className="absolute right-3 top-3 h-[70%] w-[34%] bg-black/10" />
          <div className="absolute left-3 top-3 z-20 rounded-[18px] bg-white px-3 py-2 text-[14px] font-black uppercase tracking-[-0.06em] text-black">
            Poster
          </div>
          <div className="absolute left-3 bottom-3 z-20 rounded-[16px] bg-black px-3 py-2 text-[14px] font-black uppercase tracking-[-0.06em] text-white">
            Burst
          </div>
        </div>
      );
    case "mono-stage":
    default:
      return (
        <div className="relative h-full overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#0f1115_0%,#09090b_100%)]">
          <div className="absolute inset-x-4 top-4 h-px bg-white/15" />
          <div className="absolute left-4 top-5 z-20 rounded-[18px] bg-white/8 px-3 py-2 text-[16px] font-black uppercase tracking-[-0.06em] text-white backdrop-blur-md">
            Mono
          </div>
          <div className="absolute left-3 top-12 h-[74%] w-[50%] rounded-[36px] bg-black/60" />
          <div className="absolute right-5 top-10 z-20 rounded-[22px] bg-white/8 px-3 py-2 text-[16px] font-black uppercase tracking-[-0.06em] text-white backdrop-blur-md">
            Stage
          </div>
          <div className="absolute bottom-4 right-4 h-12 w-12 rounded-full border border-white/25 bg-white/5" />
        </div>
      );
  }
}

export function BannerStylesModal({ isOpen, activePresetId, onClose, onApplyPreset }: BannerStylesModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/94 p-4 backdrop-blur-xl" onClick={onClose}>
      <div
        className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/5 bg-[#010101]/99 shadow-[0_40px_160px_rgba(0,0,0,0.9)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/5 bg-black/20 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Banner styles</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Choose a ready-made look</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Six distinct templates, each with its own typography, composition, and visual tone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto bg-black/10 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bannerStylePresets.map((preset) => {
              const active = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset.id)}
                  className={`group overflow-hidden rounded-[24px] border border-transparent bg-white/[0.015] text-left transition hover:border-sky-400/35 hover:bg-white/[0.03] hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)] ${
                    active ? "bg-white/[0.025]" : ""
                  }`}
                >
                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="min-w-0 text-[15px] font-semibold tracking-[-0.02em] text-white">{preset.label}</h3>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full transition ${active ? "bg-sky-400" : "bg-white/12 group-hover:bg-sky-400"}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 overflow-hidden rounded-[18px] bg-black/24 p-1.5">
                      <div className="aspect-[16/10]">
                        <StylePreview presetId={preset.id} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
