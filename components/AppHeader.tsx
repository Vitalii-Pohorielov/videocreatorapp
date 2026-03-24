"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useAuthSession } from "@/lib/useAuthSession";

export function AppHeader() {
  const { isLoading, user } = useAuthSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = useMemo(() => {
    const metadata = user?.user_metadata;
    return metadata?.avatar_url ?? metadata?.picture ?? null;
  }, [user]);

  const avatarLabel = useMemo(() => {
    const metadata = user?.user_metadata;
    const fullName = metadata?.full_name ?? metadata?.name ?? user?.email ?? "User";
    return String(fullName).trim().charAt(0).toUpperCase() || "C";
  }, [user]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <Image src="/logo.png" alt="ClipLab logo" width={32} height={32} className="h-8 w-8 object-contain" priority />
            </div>
            <p className="text-sm font-semibold tracking-[-0.02em] text-white sm:text-base">ClipLab</p>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && !user ? (
            <GoogleSignInButton
              redirectPath="/projects"
              label="Sign in"
              className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
            />
          ) : null}
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Open account menu"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="User avatar" width={44} height={44} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <span>{avatarLabel}</span>
                )}
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] w-64 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
                  <div className="border-b border-white/10 px-3 py-3">
                    <p className="truncate text-sm font-medium text-white">{user.user_metadata?.full_name ?? user.user_metadata?.name ?? "User"}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>

                  <div className="mt-2 flex flex-col gap-1">
                    <Link
                      href="/editor"
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-2xl px-3 py-2.5 text-sm text-white transition hover:bg-white/[0.06]"
                    >
                      Open editor
                    </Link>
                    <Link
                      href="/projects"
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-2xl px-3 py-2.5 text-sm text-white transition hover:bg-white/[0.06]"
                    >
                      Open projects
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="rounded-2xl px-3 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-400/10"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
