"use client";

type ExpressCreateModalProps = {
  isOpen: boolean;
  value: string;
  isBusy?: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ExpressCreateModal({ isOpen, value, isBusy = false, onChange, onClose, onSubmit }: ExpressCreateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-slate-950/95 p-6 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Express Create</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">Paste project lines</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Use one line per scene in the format <code>Name**Slogan</code>.
        </p>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={12}
          className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
          placeholder={`Startups Lab**Launch, Showcase and Elevate your Product\nVaultScan**Offline secret scanning for CI/CD pipelines. Fast, private, open-source.\nJazzberry**AI Agent for bug finding`}
        />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isBusy}
            className="flex-1 rounded-2xl border border-emerald-400/20 bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? "Building..." : "Create scenes"}
          </button>
        </div>
      </div>
    </div>
  );
}
