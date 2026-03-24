"use client";

import Link from "next/link";

const steps = [
  "Sign in with Google to open your private workspace.",
  "Open the editor and start a new project.",
  "Paste a website URL or build scenes manually.",
  "Edit text, visuals, timing, and layout scene by scene.",
  "Save the draft and export the final clip as MP4.",
];

export function LandingScreen() {
  return (
    <main className="min-h-[calc(100vh-72px)] px-6 py-16 text-slate-100 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <div className="max-w-4xl">
          <h1 className="text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl xl:text-7xl">
            ClipLab
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Minimal video creation for product stories, launches, and explainers.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/editor"
              className="rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Create video
            </Link>
          </div>
        </div>

        <div className="mt-20 w-full max-w-3xl border-t border-white/10 pt-8 text-left">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">How It Works</p>
          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <div key={step} className="flex items-start gap-4">
                <span className="w-8 shrink-0 text-sm font-semibold text-sky-300">{String(index + 1).padStart(2, "0")}</span>
                <p className="text-base leading-7 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
