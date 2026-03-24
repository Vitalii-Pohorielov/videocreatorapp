"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useAuthSession } from "@/lib/useAuthSession";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/editor", label: "Editor" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const { isLoading, user } = useAuthSession();

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
              <Image src="/logo.png" alt="Video Creator App logo" width={32} height={32} className="h-8 w-8 object-contain" priority />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-[-0.02em] text-white">Video Creator App</p>
              <p className="text-xs text-slate-400">Browser video studio</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user?.email ? <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 lg:inline-flex">{user.email}</span> : null}
          {!isLoading && !user ? (
            <GoogleSignInButton
              redirectPath="/projects"
              label="Sign in"
              className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
            />
          ) : null}
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
