export function ViralScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
      : score >= 60
        ? "border-studio-400/30 bg-studio-400/15 text-blue-100"
        : score >= 40
          ? "border-amber-300/30 bg-amber-400/15 text-amber-100"
          : "border-slate-400/20 bg-slate-400/10 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>
      {score}/100
    </span>
  );
}
