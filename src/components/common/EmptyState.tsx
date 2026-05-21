import type { ReactNode } from "react";

export function EmptyState({ title, body }: { title: string; body: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/[0.12] bg-white/[0.025] p-6 text-center">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-slate-400">{body}</div>
    </div>
  );
}
