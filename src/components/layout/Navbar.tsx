import Link from "next/link";
import { Clapperboard, Layers, LayoutDashboard, Wand2 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-studio-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-studio-500 text-white">
            <Clapperboard className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold text-white">Short Clip Studio</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/bulk"
            className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Layers className="h-4 w-4" />
            Bulk Editor
          </Link>
          <Link
            href="/editor"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/[0.06] px-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
          >
            <Wand2 className="h-4 w-4" />
            Editor
          </Link>
        </nav>
      </div>
    </header>
  );
}
