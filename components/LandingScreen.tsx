"use client";

export function LandingScreen() {
  return (
    <main className="min-h-[calc(100vh-72px)] px-4 py-4 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-7xl items-center justify-center rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,29,0.95),rgba(15,23,42,0.88)),radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(250,204,21,0.12),transparent_24%)] px-6 shadow-[0_30px_120px_rgba(2,6,23,0.45)]">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl xl:text-7xl">
            ClipLab
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Minimal video creation for product stories, launches, and explainers.
          </p>
        </div>
      </section>
    </main>
  );
}
