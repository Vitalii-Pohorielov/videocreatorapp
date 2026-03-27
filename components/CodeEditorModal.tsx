"use client";

type CodeEditorModalProps = {
  isOpen: boolean;
  title?: string;
  code: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onClose: () => void;
};

export function CodeEditorModal({ isOpen, title = "Edit code", code, onChange, onApply, onClose }: CodeEditorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/96 p-5 text-slate-100 shadow-[0_28px_90px_rgba(2,6,23,0.65)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Code preview</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Paste or type your code here. The scene preview will update when you apply changes.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>

        <div className="mt-5 rounded-[22px] border border-white/10 bg-black/90 p-4">
          <textarea
            value={code}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            wrap="off"
            className="min-h-[260px] max-h-[48vh] w-full resize-y rounded-[18px] border border-white/10 bg-black px-4 py-4 font-mono text-[14px] leading-7 tracking-[-0.02em] text-white outline-none placeholder:text-white/30 focus:border-sky-400"
            placeholder="Paste your code here..."
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-2xl border border-sky-400/20 bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
