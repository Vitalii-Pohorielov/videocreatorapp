"use client";

import Link from "next/link";

type CreateModeSwitcherProps = {
  active: "video" | "mobile-video" | "banner";
  className?: string;
};

const linkBaseClassName =
  "flex-1 rounded-[24px] border px-4 py-4 text-left transition sm:px-5";

export function CreateModeSwitcher({ active, className = "" }: CreateModeSwitcherProps) {
  return (
    <div className={`rounded-[28px] border border-white/10 bg-slate-950/70 p-3 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur ${className}`.trim()}>
      <p className="px-2 text-xs uppercase tracking-[0.24em] text-slate-500">Create</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Link
          href="/editor"
          className={`${linkBaseClassName} ${
            active === "video"
              ? "border-sky-300/40 bg-sky-300/12 shadow-[0_16px_40px_rgba(56,189,248,0.12)]"
              : "border-white/10 bg-white/[0.04] hover:border-sky-400/35 hover:bg-white/[0.07]"
          }`}
        >
          <p className="text-sm font-semibold text-white">Create video</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Open the scene editor for promo videos and continue working with the existing save/export flow.</p>
        </Link>

        <Link
          href="/mobile-video"
          className={`${linkBaseClassName} ${
            active === "mobile-video"
              ? "border-amber-300/40 bg-amber-300/12 shadow-[0_16px_40px_rgba(251,191,36,0.12)]"
              : "border-white/10 bg-white/[0.04] hover:border-amber-400/35 hover:bg-white/[0.07]"
          }`}
        >
          <p className="text-sm font-semibold text-white">Create mobile video</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Open a cloned video editor flow for mobile-focused experiments without touching the main workflow.</p>
        </Link>

        <Link
          href="/banner"
          className={`${linkBaseClassName} ${
            active === "banner"
              ? "border-emerald-300/40 bg-emerald-300/12 shadow-[0_16px_40px_rgba(16,185,129,0.12)]"
              : "border-white/10 bg-white/[0.04] hover:border-emerald-400/35 hover:bg-white/[0.07]"
          }`}
        >
          <p className="text-sm font-semibold text-white">Create banner</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Start the new banner builder with editable text, colors, fonts, and image theme controls.</p>
        </Link>
      </div>
    </div>
  );
}
