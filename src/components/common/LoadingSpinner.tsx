export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-slate-300">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-studio-400" />
      <span>{label}</span>
    </div>
  );
}
