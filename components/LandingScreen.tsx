"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const steps = [
  "Sign in with Google to open your private workspace.",
  "Open the editor and start a new project.",
  "Paste a website URL or build scenes manually.",
  "Edit text, visuals, timing, and layout scene by scene.",
  "Save the draft and export the final clip as MP4.",
];

const demoVideos = [
  {
    title: "MarsX",
    src: "/demo/MarsX.mp4",
  },
  {
    title: "Unicorn Platform",
    src: "/demo/Unicorn Platform.mp4",
  },
  {
    title: "SEO Bot",
    src: "/demo/SEO Bot.mp4",
  },
  {
    title: "ListingBott",
    src: "/demo/ListingBott.mp4",
  },
];

export function LandingScreen() {
  const [activeDemoIndex, setActiveDemoIndex] = useState(0);
  const activeDemo = demoVideos[activeDemoIndex] ?? demoVideos[0];
  const mainRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const demoRef = useRef<HTMLElement | null>(null);
  const ctaRef = useRef<HTMLElement | null>(null);
  const activeScreenRef = useRef(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    const screens = [heroRef.current, demoRef.current, ctaRef.current].filter((section): section is HTMLElement => Boolean(section));
    if (screens.length === 0) return;

    const scrollToScreen = (index: number) => {
      const nextIndex = Math.max(0, Math.min(index, screens.length - 1));
      activeScreenRef.current = nextIndex;
      isAnimatingRef.current = true;
      screens[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        isAnimatingRef.current = false;
      }, 700);
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 10 || isAnimatingRef.current) return;
      event.preventDefault();
      scrollToScreen(activeScreenRef.current + (event.deltaY > 0 ? 1 : -1));
    };

    const updateActiveScreen = () => {
      const containerTop = container.getBoundingClientRect().top;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      screens.forEach((screen, index) => {
        const distance = Math.abs(screen.getBoundingClientRect().top - containerTop);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      activeScreenRef.current = closestIndex;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("scroll", updateActiveScreen, { passive: true });
    updateActiveScreen();

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", updateActiveScreen);
    };
  }, []);

  return (
    <main ref={mainRef} className="h-[calc(100vh-72px)] overflow-y-auto scroll-smooth px-6 text-slate-100 sm:px-8 lg:px-12">
      <section ref={heroRef} className="snap-start">
        <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-5xl flex-col items-center justify-center py-12 text-center">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl xl:text-7xl">
              Video creation. <span className="animate-[heroAccent_6s_linear_infinite]">Zero AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              A new way to build promo videos - faster than editing, more predictable than AI.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/editor"
                className="rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                Build Your First Video
              </Link>
              <a
                href="#real-examples"
                className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                Watch Example
              </a>
            </div>

            <div className="mt-14 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-left">
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

            <div className="mt-8 flex flex-col items-center gap-2 text-sm text-slate-500">
              <span>Scroll to see real examples</span>
              <span className="animate-bounce text-xl leading-none text-sky-300">↓</span>
            </div>
          </div>
        </div>
      </section>

      <section id="real-examples" ref={demoRef} className="snap-start">
        <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-6xl flex-col justify-center py-12">
          <div className="flex flex-col items-start justify-between gap-3 text-left sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Real examples</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">Customer videos in action.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">Built with the editor. Used to grow real products.</p>
          </div>

          <div className="mt-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 text-left">
                <div className="bg-black">
                  <video
                    key={activeDemo.src}
                    className="aspect-[16/9] w-full object-cover"
                    src={activeDemo.src}
                    controls
                    muted
                    playsInline
                    autoPlay
                    loop
                    preload="metadata"
                  />
                </div>
              </div>

              <div className="grid gap-3 text-left">
                {demoVideos.map((video, index) => {
                  const isActive = index === activeDemoIndex;

                  return (
                    <button
                      key={video.src}
                      type="button"
                      onClick={() => setActiveDemoIndex(index)}
                      className={`rounded-[22px] border p-3 text-left transition ${
                        isActive
                          ? "border-sky-300/40 bg-sky-300/10 shadow-[0_12px_32px_rgba(56,189,248,0.12)]"
                          : "border-white/10 bg-slate-950/55 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black">
                          <video className="aspect-[16/9] w-full object-cover" src={video.src} muted playsInline loop autoPlay preload="metadata" />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{video.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{isActive ? "Selected" : "Click to preview"}</p>
                          </div>
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm ${
                              isActive ? "border-sky-300/40 bg-sky-300/15 text-sky-200" : "border-white/10 bg-white/[0.03] text-slate-300"
                            }`}
                          >
                            {isActive ? "II" : ">"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="snap-start">
        <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-5xl flex-col py-12 text-center">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-10 sm:px-10 sm:py-12">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Get started</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Video creation. <span className="animate-[heroAccent_6s_linear_infinite]">Zero AI</span>
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                A new way to build promo videos - faster than editing, more predictable than AI.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/editor"
                  className="rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  Build Your First Video
                </Link>
                <a
                  href="#real-examples"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                >
                  Watch Example
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
