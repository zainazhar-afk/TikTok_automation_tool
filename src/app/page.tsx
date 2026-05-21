import Link from "next/link";
import {
  BarChart3,
  CloudOff,
  Download,
  Film,
  MonitorPlay,
  Scissors,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/common/Card";

const features = [
  {
    title: "YouTube Channel Analysis",
    description: "Rank public channel videos by engagement, recency, and short-form fit.",
    icon: BarChart3
  },
  {
    title: "Local Video Editing",
    description: "Upload videos you own and edit them directly in the browser.",
    icon: Scissors
  },
  {
    title: "TikTok 9:16 Export",
    description: "Crop and export vertical clips for TikTok, Reels, and Shorts.",
    icon: MonitorPlay
  },
  {
    title: "No Cloud Storage",
    description: "Source videos stay inside your browser's IndexedDB storage.",
    icon: CloudOff
  },
  {
    title: "Browser-Based Processing",
    description: "ffmpeg.wasm handles trimming, filters, audio, and export locally.",
    icon: Film
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              <Sparkles className="h-4 w-4 text-studio-mint" />
              Metadata-driven clip planning plus local editing
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-white md:text-7xl">
              Turn Long Videos Into Viral Short Clips
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Analyze YouTube channel performance, upload your own video, edit locally,
              and export TikTok-ready clips.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-studio-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-500"
              >
                Start Creating
              </Link>
              <Link
                href="/dashboard#analyze"
                className="inline-flex items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
              >
                Analyze Channel
              </Link>
            </div>
          </div>

          <div className="relative min-h-[520px] rounded-lg border border-white/10 bg-slate-950/80 p-4 shadow-soft">
            <div className="grid h-full grid-cols-[88px_1fr] gap-4">
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
                <div className="mb-5 h-8 rounded-md bg-studio-500/80" />
                <div className="space-y-3">
                  <div className="h-10 rounded-md bg-white/10" />
                  <div className="h-10 rounded-md bg-white/[0.06]" />
                  <div className="h-10 rounded-md bg-white/[0.06]" />
                  <div className="h-10 rounded-md bg-white/[0.06]" />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
                    <div className="h-2 w-16 rounded-full bg-slate-600" />
                    <div className="mt-4 h-6 w-20 rounded bg-white/[0.16]" />
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
                    <div className="h-2 w-14 rounded-full bg-slate-600" />
                    <div className="mt-4 h-6 w-16 rounded bg-studio-mint/70" />
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
                    <div className="h-2 w-12 rounded-full bg-slate-600" />
                    <div className="mt-4 h-6 w-20 rounded bg-studio-accent/70" />
                  </div>
                </div>
                <div className="grid flex-1 grid-cols-[0.75fr_1fr] gap-4">
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="aspect-[9/16] overflow-hidden rounded-md border border-white/10 bg-slate-900">
                      <div className="h-1/3 bg-studio-500/70" />
                      <div className="h-1/3 bg-studio-accent/70" />
                      <div className="h-1/3 bg-studio-mint/60" />
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/[0.14]" />
                    <div className="mt-2 h-2 w-2/3 rounded-full bg-white/[0.08]" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-28 rounded-full bg-slate-500" />
                        <Download className="h-5 w-5 text-studio-mint" />
                      </div>
                      <div className="mt-5 h-3 rounded-full bg-slate-700">
                        <div className="h-3 w-2/3 rounded-full bg-studio-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="aspect-video rounded-lg border border-white/[0.08] bg-white/[0.05] p-3"
                        >
                          <div className="h-2 w-12 rounded-full bg-white/20" />
                          <div className="mt-8 h-2 w-20 rounded-full bg-white/10" />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-studio-mint/25 bg-studio-mint/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-studio-mint">
                        <ShieldCheck className="h-4 w-4" />
                        Metadata only, user-owned uploads only
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-5">
                <Icon className="h-6 w-6 text-studio-400" />
                <h2 className="mt-5 text-base font-semibold text-white">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
