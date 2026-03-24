export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 text-sm text-slate-400">
        <div>
          <p className="font-medium text-slate-200">© {year}</p>
        </div>
      </div>
    </footer>
  );
}
