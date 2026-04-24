"use client";

type VideoWorkspaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (workspace: "promo" | "mobile") => void;
};

const workspaceCards = [
  {
    id: "promo" as const,
    eyebrow: "Main editor",
    title: "Promo video",
    description: "Open the promo editor with its own entry flow and the shared server-rendered export pipeline.",
    accentClassName: "hover:border-sky-400/35 hover:bg-sky-400/[0.08]",
  },
  {
    id: "mobile" as const,
    eyebrow: "Mobile lab",
    title: "Mobile video",
    description: "Open the mobile editor with its own workspace flow while keeping the same server-rendered export path.",
    accentClassName: "hover:border-amber-300/35 hover:bg-amber-300/[0.08]",
  },
];

export function VideoWorkspaceModal({ isOpen, onClose, onSelect }: VideoWorkspaceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-slate-950/95 p-6 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">New video</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">Choose your video workspace</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Start in the promo editor or jump into the mobile editor. The editing flows stay separate, but export runs through the same server-rendered pipeline.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {workspaceCards.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              onClick={() => onSelect(workspace.id)}
              className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition ${workspace.accentClassName}`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{workspace.eyebrow}</p>
              <h3 className="mt-3 text-lg font-semibold text-white">{workspace.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{workspace.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
