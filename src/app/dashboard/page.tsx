"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, BarChart3, Flame, Heart, ShieldCheck, TrendingUp } from "lucide-react";
import { Card } from "@/components/common/Card";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Sidebar } from "@/components/layout/Sidebar";
import { LocalVideoLibrary } from "@/components/upload/LocalVideoLibrary";
import { VideoUploader } from "@/components/upload/VideoUploader";
import { YouTubeUrlInput } from "@/components/upload/YouTubeUrlInput";
import { ChannelOverview } from "@/components/youtube/ChannelOverview";
import { ChannelUrlForm } from "@/components/youtube/ChannelUrlForm";
import { VideoGrid } from "@/components/youtube/VideoGrid";
import {
  getYouTubeAnalysis,
  saveSelectedReference,
  saveYouTubeAnalysis
} from "@/lib/indexedDb";
import { formatNumber } from "@/lib/videoUtils";
import type { YouTubeChannel, YouTubeVideo } from "@/types/youtube";

export default function DashboardPage() {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedReference, setSelectedReference] = useState<YouTubeVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getYouTubeAnalysis()
      .then((snapshot) => {
        if (!snapshot || !isMounted) return;
        setChannel(snapshot.channel);
        setVideos(snapshot.videos);
        setSelectedReference(snapshot.selectedReference);
        setRestoredAt(snapshot.updatedAt);
      })
      .catch(() => {
        if (isMounted) {
          setError("Saved channel analysis could not be loaded in this browser.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0);
    const totalEngagement = videos.reduce(
      (sum, video) => sum + video.likeCount + video.commentCount,
      0
    );
    const bestVideo = [...videos].sort((a, b) => b.viralScore - a.viralScore)[0];

    return {
      totalFetched: videos.length,
      averageViews: videos.length ? Math.round(totalViews / videos.length) : 0,
      bestScore: bestVideo?.viralScore ?? 0,
      mostEngaging: [...videos].sort(
        (a, b) =>
          b.likeCount + b.commentCount * 2 - (a.likeCount + a.commentCount * 2)
      )[0],
      totalEngagement
    };
  }, [videos]);

  async function handleAnalyze(channelUrl: string) {
    setError("");
    setSelectedReference(null);
    setIsLoading(true);

    try {
      const channelResponse = await fetch("/api/youtube/channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ channelUrl })
      });

      const channelBody = await channelResponse.json();
      if (!channelResponse.ok) {
        throw new Error(channelBody.error ?? "Unable to fetch this channel.");
      }

      const fetchedChannel = channelBody as YouTubeChannel;
      setChannel(fetchedChannel);

      const videosResponse = await fetch("/api/youtube/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channelId: fetchedChannel.channelId,
          uploadsPlaylistId: fetchedChannel.uploadsPlaylistId
        })
      });

      const videosBody = await videosResponse.json();
      if (!videosResponse.ok) {
        throw new Error(videosBody.error ?? "Unable to fetch channel videos.");
      }

      const fetchedVideos = videosBody.videos ?? [];
      setVideos(fetchedVideos);
      setRestoredAt(null);
      await saveYouTubeAnalysis({
        channel: fetchedChannel,
        videos: fetchedVideos,
        selectedReference: null
      });
    } catch (caught) {
      setChannel(null);
      setVideos([]);
      setRestoredAt(null);
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleUseReference(video: YouTubeVideo) {
    setSelectedReference(video);
    saveSelectedReference(video).catch(() => {
      setError("Reference selected, but it could not be saved for the next refresh.");
    });
    document.getElementById("uploads")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)]">
      <Sidebar />
      <div className="min-w-0 flex-1 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-studio-400">
                Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-normal text-white">
                Plan the clip, then edit your own upload
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                We can analyze this YouTube channel, but editing requires uploading your own
                source video.
              </p>
            </div>
          </section>

          <Card className="p-5">
            <div className="flex gap-3 text-sm leading-6 text-slate-300">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-studio-mint" />
              <p>
                This tool analyzes YouTube metadata only. It does not download YouTube videos.
                Please upload videos that you own or have permission to edit.
              </p>
            </div>
          </Card>

          <section id="analyze" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">YouTube Channel Analysis</h2>
              <div className="flex items-center gap-3">
                {restoredAt ? (
                  <span className="text-xs text-slate-500">
                    Restored saved analysis from {new Date(restoredAt).toLocaleString()}
                  </span>
                ) : null}
                {isLoading ? <LoadingSpinner label="Fetching metadata" /> : null}
              </div>
            </div>
            <ChannelUrlForm onSubmit={handleAnalyze} isLoading={isLoading} />
            {error ? <ErrorMessage message={error} /> : null}
          </section>

          {channel ? <ChannelOverview channel={channel} /> : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Total videos fetched"
              value={formatNumber(stats.totalFetched)}
            />
            <MetricCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Average views"
              value={formatNumber(stats.averageViews)}
            />
            <MetricCard
              icon={<Flame className="h-5 w-5" />}
              label="Best viral score"
              value={`${stats.bestScore}/100`}
            />
            <MetricCard
              icon={<Heart className="h-5 w-5" />}
              label="Most engaging video"
              value={stats.mostEngaging ? stats.mostEngaging.title : "None yet"}
              compact
            />
          </section>

          {selectedReference ? (
            <div className="rounded-lg border border-studio-400/25 bg-studio-400/10 p-4">
              <div className="flex items-start gap-3 text-sm text-blue-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Reference selected: <span className="font-semibold">{selectedReference.title}</span>.
                  This stores metadata for planning only and does not download the YouTube video.
                  Upload your own source video below, then open the editor to cut a clip.
                </p>
              </div>
            </div>
          ) : null}

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Popular Videos Ranked by Viral Score</h2>
              <span className="text-sm text-slate-500">{videos.length ? `${videos.length} ranked` : ""}</span>
            </div>
            <VideoGrid
              videos={videos}
              selectedVideoId={selectedReference?.id}
              onUseReference={handleUseReference}
            />
          </section>

          <section id="uploads" className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-semibold text-white">Download from YouTube</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Paste a YouTube video URL to download it directly into the editor.
              </p>
              <div className="mt-5">
                <YouTubeUrlInput />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-semibold text-white">Upload Original Video</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The file is stored locally in your browser for editing.
              </p>
              <div className="mt-5">
                <VideoUploader onSaved={() => setLibraryRefreshKey((key) => key + 1)} />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-semibold text-white">Local Uploaded Video Library</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Open any saved source video in the editor.
              </p>
              <div className="mt-5">
                <LocalVideoLibrary refreshKey={libraryRefreshKey} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  compact = false
}: {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
        {icon}
        {label}
      </div>
      <div
        className={`mt-4 font-semibold text-white ${
          compact ? "line-clamp-2 text-base leading-6" : "text-3xl"
        }`}
      >
        {value}
      </div>
    </Card>
  );
}
