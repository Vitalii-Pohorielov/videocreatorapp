"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useEffect, useState } from "react";

import { ConfirmModal } from "@/components/ConfirmModal";
import { ProjectTypeModal } from "@/components/ProjectTypeModal";
import { deleteProject, deleteProjects, listProjects } from "@/lib/projectPersistence";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useAuthSession } from "@/lib/useAuthSession";
import { usePremiumStatus } from "@/lib/usePremiumStatus";
import type { VideoType } from "@/store/useStore";

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
  const router = useRouter();
  const { user } = useAuthSession();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isProjectTypeModalOpen, setIsProjectTypeModalOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    try {
      setBusyProjectId(projectId);
      setError(null);
      await deleteProject(projectId);
      setProjects((current) => current.filter((project) => project.id !== projectId));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Could not delete project.";
      setError(message);
    } finally {
      setBusyProjectId(null);
      setPendingDelete(null);
    }
  };

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const handleDeleteAll = async () => {
    if (filteredProjects.length === 0) return;

    try {
      setIsDeletingAll(true);
      setError(null);
      await deleteProjects(filteredProjects.map((project) => project.id));
      setProjects((current) => current.filter((project) => !filteredProjects.some((visibleProject) => visibleProject.id === project.id)));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Could not delete projects.";
      setError(message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleCreateProject = (videoType: VideoType) => {
    setIsProjectTypeModalOpen(false);
    const query = videoType === "announcement" ? "?videoType=announcement" : "";
    router.push(`/editor${query}`);
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_32%),linear-gradient(180deg,#060b16_0%,#0b1220_44%,#0f172a_100%)] px-4 py-6 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/70 px-6 py-8 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">Your projects, all in one place.</h1>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Start a new clip, reopen an existing draft, and jump back into editing without losing your flow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user?.email ? (
                <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                  {user.email}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setIsProjectTypeModalOpen(true)}
                disabled={isPremiumLoading}
                className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPremiumLoading ? "Checking access..." : "New project"}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/70 px-6 py-6 shadow-[0_16px_40px_rgba(2,6,23,0.35)] backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Library</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Saved drafts</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative w-full sm:w-[320px]">
                <span className="sr-only">Search projects</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search projects"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleDeleteAll()}
                disabled={isDeletingAll || filteredProjects.length === 0}
                className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-5 py-3 text-sm font-medium text-rose-300 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingAll ? "Deleting all..." : "Delete all"}
              </button>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                {filteredProjects.length} / {projects.length} items
              </span>
            </div>
          </div>

          {isLoading ? <p className="text-sm text-slate-400">Loading projects...</p> : null}
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          {!isPremiumLoading && !isPremium ? (
            <div className="mb-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              Free mode supports promo videos with Intro, Highlight, and Features scenes only.
            </div>
          ) : null}

          {!isLoading && !error && projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
              <p className="text-lg font-medium text-white">No drafts yet.</p>
              <p className="mt-2 text-sm text-slate-400">Create your first clip in the editor and it will appear here.</p>
            </div>
          ) : null}

          {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
              <p className="text-lg font-medium text-white">No matching drafts.</p>
              <p className="mt-2 text-sm text-slate-400">Try a different search or clear the filter.</p>
            </div>
          ) : null}

          {!isLoading && !error && filteredProjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredProjects.map((project) => (
                <article key={project.id} className="flex min-h-[220px] flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-sky-400/40 hover:bg-white/[0.07]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-white">{project.name}</h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">Updated {formatRelativeDate(project.updated_at)}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex gap-3 pt-5">
                    <Link
                      href={`/editor?project=${project.id}`}
                      className="flex-1 rounded-2xl bg-sky-400 px-4 py-2.5 text-center text-sm font-medium text-slate-950 transition hover:bg-sky-300"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ id: project.id, name: project.name })}
                      disabled={busyProjectId === project.id}
                      className="flex-1 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyProjectId === project.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete "${pendingDelete.name}"?` : "Delete project?"}
        description="This project will be removed from your library."
        confirmLabel="Delete project"
        cancelLabel="Cancel"
        tone="danger"
        isBusy={Boolean(pendingDelete && busyProjectId === pendingDelete.id)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          void handleDeleteProject(pendingDelete.id, pendingDelete.name);
        }}
      />
      <ProjectTypeModal
        isOpen={isProjectTypeModalOpen}
        onClose={() => setIsProjectTypeModalOpen(false)}
        onSelect={handleCreateProject}
      />
    </main>
  );
}
