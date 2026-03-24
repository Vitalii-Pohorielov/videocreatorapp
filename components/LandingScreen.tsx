"use client";

import Link from "next/link";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useAuthSession } from "@/lib/useAuthSession";

const featureCards = [
  {
    title: "Start from a webpage",
    description: "Drop in a URL and let ClipLab build a first video draft from the page content.",
  },
  {
    title: "Shape every scene",
    description: "Adjust text, screenshots, timing, layouts, and visual style in one focused workspace.",
  },
  {
    title: "Keep drafts organized",
    description: "Save projects to your account, reopen them later, and keep each workspace private.",
  },
];

export function LandingScreen() {
  const { isLoading, user, error } = useAuthSession();

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden px-4 py-4 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-7xl flex-col overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,29,0.95),rgba(15,23,42,0.88)),radial-gradient(circle_at_top_left,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(250,204,21,0.18),transparent_24%)] shadow-[0_30px_120px_rgba(2,6,23,0.45)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-sky-300">ClipLab</p>
            <p className="mt-2 text-sm text-slate-400">Minimal video creation for product stories, launches, and explainers.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200">
                  {user.email ?? "Signed in"}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Sign out
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid flex-1 items-stretch gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:px-8 lg:py-10">
          <div className="flex flex-col justify-center">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-sky-300/25 bg-sky-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-sky-200">
                Built for short-form product videos
              </div>
              <h1 className="mt-6 text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl xl:text-7xl">
                Turn product ideas into polished clips with ClipLab.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                ClipLab helps you turn a webpage or rough concept into a clean video draft, refine each scene visually,
                export MP4 in the browser, and keep your saved projects in one place.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link
                    href="/editor"
                    className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                  >
                    Open editor
                  </Link>
                  <Link
                    href="/projects"
                    className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.1]"
                  >
                    Open library
                  </Link>
                </>
              ) : (
                <GoogleSignInButton
                  redirectPath="/projects"
                  className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
                />
              )}
            </div>

            {isLoading ? <p className="mt-4 text-sm text-slate-400">Checking sign-in status...</p> : null}
            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {featureCards.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_40px_rgba(2,6,23,0.2)]"
                >
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="flex min-h-[420px] items-center">
            <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.96))] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.4)]">
              <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.24),transparent_56%)]" />
              <div className="relative space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-sky-300">Flow</p>
                  <div className="mt-4 grid gap-3">
                    {["1. Sign in with Google", "2. Start a new ClipLab project", "3. Build or generate scenes", "4. Save and export your clip"].map((step) => (
                      <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Editor</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Scenes, styling, preview, export</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Security</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Private workspace with Google sign-in and project-level access</p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(15,23,42,0.12))] p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-300">Project summary</p>
                  <p className="mt-4 text-base leading-7 text-slate-200">
                    ClipLab is a browser-first studio for creating short product videos with URL-based draft generation,
                    visual scene editing, cloud saves, and fast MP4 export.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
