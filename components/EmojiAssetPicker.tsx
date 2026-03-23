"use client";

import { createPortal } from "react-dom";

import { animatedEmojiGroupLabels, animatedEmojiLibrary } from "@/lib/animatedEmojiLibrary";

type EmojiAssetPickerProps = {
  onAnimatedSelect: (imageUrl: string, fallbackEmoji: string) => void;
  onClose: () => void;
};

export function EmojiAssetPicker({ onAnimatedSelect, onClose }: EmojiAssetPickerProps) {
  const groups = ["developer", "product", "infra", "status"] as const;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-3xl border border-white/15 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Animated emoji</p>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10">
            Close
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {groups.map((group) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">{animatedEmojiGroupLabels[group]}</p>
              <div className="grid grid-cols-4 gap-2">
                {animatedEmojiLibrary.filter((item) => item.group === group).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onAnimatedSelect(item.imageUrl, item.emoji)}
                    className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-center transition hover:bg-white/10"
                  >
                    <img src={item.imageUrl} alt={item.label} className="h-10 w-10 object-contain" />
                    <span className="text-[10px] leading-tight text-white/75">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
