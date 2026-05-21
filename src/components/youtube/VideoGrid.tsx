"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { VideoCard } from "@/components/youtube/VideoCard";
import type { YouTubeVideo } from "@/types/youtube";

export function VideoGrid({
  videos,
  selectedVideoId,
  onUseReference
}: {
  videos: YouTubeVideo[];
  selectedVideoId?: string;
  onUseReference: (video: YouTubeVideo) => void;
}) {
  if (videos.length === 0) {
    return (
      <EmptyState
        title="No videos loaded"
        body="Analyze a channel to rank its public uploads by viral potential."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          isSelected={selectedVideoId === video.id}
          onUseReference={onUseReference}
        />
      ))}
    </div>
  );
}
