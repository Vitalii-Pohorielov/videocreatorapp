"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    label: "Log In",
    text: "Access your workspace in one click.",
  },
  {
    label: "Input",
    text: "Paste a product URL or start clean.",
  },
  {
    label: "Generate",
    text: "Smart engine pre-fills scenes from your page.",
  },
  {
    label: "Edit",
    text: "Fine-tune text, timing, and visuals with full control.",
  },
  {
    label: "Export",
    text: "Render crisp MP4 clips ready for campaign.",
  },
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

const audienceWords = ["SaaS", "Marketers", "Founders", "Product Teams"];

export function LandingScreen() {
  const [activeDemoIndex, setActiveDemoIndex] = useState(0);
  const [activeAudienceIndex, setActiveAudienceIndex] = useState(0);
  const [typedAudienceWord, setTypedAudienceWord] = useState("");
  const [isDeletingAudienceWord, setIsDeletingAudienceWord] = useState(false);
  const activeDemo = demoVideos[activeDemoIndex] ?? demoVideos[0];
  const mainRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const demoRef = useRef<HTMLElement | null>(null);
  const ctaRef = useRef<HTMLElement | null>(null);
  const activeScreenRef = useRef(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const word = audienceWords[activeAudienceIndex] ?? "";
    let timeoutId: number;

    if (!isDeletingAudienceWord && typedAudienceWord.length < word.length) {
      timeoutId = window.setTimeout(() => {
        setTypedAudienceWord(word.slice(0, typedAudienceWord.length + 1));
      }, 85);
    } else if (!isDeletingAudienceWord) {
      timeoutId = window.setTimeout(() => {
        setIsDeletingAudienceWord(true);
      }, 1200);
    } else if (typedAudienceWord.length > 0) {
      timeoutId = window.setTimeout(() => {
        setTypedAudienceWord(word.slice(0, typedAudienceWord.length - 1));
      }, 45);
    } else {
      timeoutId = window.setTimeout(() => {
        setIsDeletingAudienceWord(false);
        setActiveAudienceIndex((currentIndex) => (currentIndex + 1) % audienceWords.length);
      }, 180);
    }

    return () => window.clearTimeout(timeoutId);
  }, [activeAudienceIndex, isDeletingAudienceWord, typedAudienceWord]);

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
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">PROMO VIDEO BUILDER</p>
            <h1 className="text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl xl:text-7xl">
              Instant Promo Videos for{" "}
              <span className="inline-flex min-w-[7.6em] items-baseline justify-center text-center text-sky-300 sm:min-w-[7.2em]">
                <span>{typedAudienceWord || "\u00a0"}</span>
                <span className="ml-1 inline-block h-[0.78em] w-[0.08em] animate-[typewriterCaret_900ms_steps(1)_infinite] bg-sky-300 align-[-0.04em]" aria-hidden="true" />
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Stop losing visitors to wall-of-text pages. Generate polished product videos directly from your URL or build scene-by-scene with total control.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/editor?chooseVideoType=1"
                className="rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                Build Your First Video
              </Link>
              <a
                href="#real-examples"
                className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                Watch Examples ↓
              </a>
            </div>

            <div className="mt-14 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-left">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">How It Works</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">From Link or Scratch to Final Export</h2>
              <div className="mt-6 space-y-4">
                {steps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <span className="w-8 shrink-0 text-sm font-semibold text-sky-300">{String(index + 1).padStart(2, "0")}</span>
                    <p className="text-base leading-6 text-slate-300">
                      <span className="font-semibold text-white">{step.label}</span>
                      <span className="text-slate-500"> (</span>
                      <span className="text-slate-400/80">{step.text}</span>
                      <span className="text-slate-500">)</span>
                    </p>
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
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">Product Promo Videos in Action</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">Built with ClipLab. Designed to showcase SaaS, apps, and marketing pages.</p>
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
                Ready to turn your product into a promo video?
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Paste your link or jump straight into the editor.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/editor?chooseVideoType=1"
                  className="rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  Create Your Promo Video Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
