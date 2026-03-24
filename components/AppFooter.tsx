"use client";

import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-slate-200">ClipLab</p>
          <p className="mt-1">Minimal video creation in the browser.</p>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/projects" className="transition hover:text-white">
            Projects
          </Link>
          <Link href="/editor" className="transition hover:text-white">
            Editor
          </Link>
        </div>
      </div>
    </footer>
  );
}
