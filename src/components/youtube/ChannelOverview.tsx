import type { ReactNode } from "react";
import { Eye, PlaySquare, Users } from "lucide-react";
import { Card } from "@/components/common/Card";
import { formatNumber } from "@/lib/videoUtils";
import type { YouTubeChannel } from "@/types/youtube";

export function ChannelOverview({ channel }: { channel: YouTubeChannel }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        {channel.thumbnail ? (
          <img
            src={channel.thumbnail}
            alt=""
            className="h-20 w-20 rounded-lg object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-lg bg-white/10" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold text-white">{channel.title}</h2>
          <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-slate-400">
            {channel.description || "No public channel description."}
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric
          icon={<Users className="h-4 w-4" />}
          label="Subscribers"
          value={channel.subscriberCount === "Hidden" ? "Hidden" : formatNumber(channel.subscriberCount)}
        />
        <Metric icon={<PlaySquare className="h-4 w-4" />} label="Videos" value={formatNumber(channel.videoCount)} />
        <Metric icon={<Eye className="h-4 w-4" />} label="Views" value={formatNumber(channel.viewCount)} />
      </div>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-slate-950/50 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
