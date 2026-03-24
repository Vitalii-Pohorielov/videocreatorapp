"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listProjects } from "@/lib/projectPersistence";

type ProjectListItem = Awaited<ReturnType<typeof listProjects>>[number];

function formatRelativeDate(value?: string) {
  if (!value) return "Unknown update";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown update";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function ProjectsWorkspace() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    listProjects()
      .then((rows) => {
        if (!isActive) return;
        setProjects(rows);
      })
      .catch((loadError) => {
        if (!isActive) return;
        const message = loadError instanceof Error ? loadError.message : "Could not load projects.";
        setError(message);
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-6 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-600">Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Projects and editor, separated cleanly.</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Start a new video, reopen an existing project, and keep the editor focused only on building scenes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/editor"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                New project
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Library</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Saved projects</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{projects.length} items</span>
          </div>

          {isLoading ? <p className="text-sm text-slate-500">Loading projects...</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          {!isLoading && !error && projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-lg font-medium text-slate-900">No saved projects yet.</p>
              <p className="mt-2 text-sm text-slate-500">Create one in the editor and it will appear here.</p>
            </div>
          ) : null}

          {!isLoading && !error && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article key={project.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-950">{project.name}</h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">Updated {formatRelativeDate(project.updated_at)}</p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{project.id}</p>
                  <div className="mt-5 flex gap-3">
                    <Link
                      href={`/editor?project=${project.id}`}
                      className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Open
                    </Link>
                    <Link
                      href={`/editor?project=${project.id}`}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
