"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuthSession } from "@/lib/useAuthSession";

type AuthGateProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function AuthGate({
  children,
  title = "Sign in to continue",
  description = "Use Google sign-in to open the video editor and manage your saved projects.",
}: AuthGateProps) {
  const { isLoading, user, error } = useAuthSession();

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 text-slate-100">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 px-8 py-10 text-center shadow-[0_16px_40px_rgba(2,6,23,0.35)]">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Loading</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Checking your session</h1>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 text-slate-100">
        <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/75 px-8 py-10 shadow-[0_24px_80px_rgba(2,6,23,0.4)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Protected Access</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">{title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-300">{description}</p>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <GoogleSignInButton
              redirectPath="/projects"
              className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
            />
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Back to landing
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
