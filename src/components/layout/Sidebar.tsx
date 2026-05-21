import Link from "next/link";
import { BarChart3, FileVideo, Scissors } from "lucide-react";

const items = [
  {
    href: "/dashboard#analyze",
    label: "Analyze",
    icon: BarChart3
  },
  {
    href: "/dashboard#uploads",
    label: "Uploads",
    icon: FileVideo
  },
  {
    href: "/editor",
    label: "Editor",
    icon: Scissors
  }
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-white/[0.025] p-4 lg:block">
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
