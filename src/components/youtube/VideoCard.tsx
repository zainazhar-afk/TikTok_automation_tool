"use client";

import { ExternalLink, MousePointer2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ViralScoreBadge } from "@/components/youtube/ViralScoreBadge";
import { formatDuration, formatNumber } from "@/lib/videoUtils";
import type { YouTubeVideo } from "@/types/youtube";

export function VideoCard({
  video,
  isSelected,
  onUseReference
}: {
  video: YouTubeVideo;
  isSelected: boolean;
  onUseReference: (video: YouTubeVideo) => void;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:border-studio-400/40">
      <div className="relative overflow-hidden rounded-lg bg-slate-900">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" className="aspect-video w-full object-cover" />
        ) : (
          <div className="aspect-video w-full bg-white/10" />
        )}
        <div className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 text-xs font-semibold text-white">
          {formatDuration(video.durationSeconds)}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-white">{video.title}</h3>
        <ViralScoreBadge score={video.viralScore} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Stat label="Views" value={formatNumber(video.viewCount)} />
        <Stat label="Likes" value={formatNumber(video.likeCount)} />
        <Stat label="Comments" value={formatNumber(video.commentCount)} />
      </dl>
      <div className="mt-3 text-xs text-slate-500">
        Published {new Date(video.publishedAt).toLocaleDateString()}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          variant={isSelected ? "secondary" : "primary"}
          size="sm"
          onClick={() => onUseReference(video)}
        >
          <MousePointer2 className="h-4 w-4" />
          {isSelected ? "Reference Set" : "Use as Reference"}
        </Button>
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
        >
          <ExternalLink className="h-4 w-4" />
          Open on YouTube
        </a>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-950/55 p-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-200">{value}</dd>
    </div>
  );
}
