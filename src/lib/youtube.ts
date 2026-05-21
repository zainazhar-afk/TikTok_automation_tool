import { calculateViralScore } from "@/lib/viralScore";
import { parseISODurationToSeconds } from "@/lib/videoUtils";
import { parseYouTubeChannelUrl } from "@/lib/validators";
import type { YouTubeChannel, YouTubeVideo } from "@/types/youtube";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

type YouTubeChannelItem = {
  id: string;
  snippet: {
    title: string;
    description?: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
    hiddenSubscriberCount?: boolean;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
};

type PlaylistItem = {
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
};

type VideoItem = {
  id: string;
  snippet: {
    title: string;
    description?: string;
    publishedAt: string;
    thumbnails?: {
      medium?: { url: string };
      high?: { url: string };
      standard?: { url: string };
      maxres?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};

export class YouTubeApiError extends Error {
  status: number;
  reason?: string;

  constructor(message: string, status = 500, reason?: string) {
    super(message);
    this.name = "YouTubeApiError";
    this.status = status;
    this.reason = reason;
  }
}

export async function getChannelFromUrl(channelUrl: string): Promise<YouTubeChannel> {
  const parsed = parseYouTubeChannelUrl(channelUrl);
  const params: Record<string, string> = {
    part: "snippet,statistics,contentDetails"
  };

  if (parsed.type === "channelId") {
    params.id = parsed.value;
  } else {
    params.forHandle = `@${parsed.value}`;
  }

  const response = await youtubeGet<{ items?: YouTubeChannelItem[] }>("channels", {
    ...params
  });

  const channel = response.items?.[0];

  if (!channel) {
    throw new YouTubeApiError("Channel not found. Check the URL and try again.", 404, "notFound");
  }

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new YouTubeApiError("This channel does not expose an uploads playlist.", 404, "noUploads");
  }

  return {
    channelId: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description ?? "",
    thumbnail:
      channel.snippet.thumbnails?.high?.url ??
      channel.snippet.thumbnails?.medium?.url ??
      channel.snippet.thumbnails?.default?.url ??
      "",
    subscriberCount: channel.statistics?.hiddenSubscriberCount
      ? "Hidden"
      : channel.statistics?.subscriberCount ?? "0",
    videoCount: channel.statistics?.videoCount ?? "0",
    viewCount: channel.statistics?.viewCount ?? "0",
    uploadsPlaylistId
  };
}

export async function getChannelVideos(input: {
  channelId: string;
  uploadsPlaylistId: string;
}): Promise<YouTubeVideo[]> {
  if (!input.channelId || !input.uploadsPlaylistId) {
    throw new YouTubeApiError("Channel details are missing. Analyze the channel again.", 400);
  }

  const playlistResponse = await youtubeGet<{ items?: PlaylistItem[] }>("playlistItems", {
    part: "contentDetails",
    playlistId: input.uploadsPlaylistId,
    maxResults: "25"
  });

  const ids =
    playlistResponse.items
      ?.map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => Boolean(id)) ?? [];

  if (ids.length === 0) {
    throw new YouTubeApiError("No videos found for this channel.", 404, "noVideos");
  }

  const videosResponse = await youtubeGet<{ items?: VideoItem[] }>("videos", {
    part: "snippet,statistics,contentDetails",
    id: ids.join(",")
  });

  const videos =
    videosResponse.items?.map((item) => {
      const durationSeconds = parseISODurationToSeconds(item.contentDetails.duration);
      const viewCount = toNumber(item.statistics?.viewCount);
      const likeCount = toNumber(item.statistics?.likeCount);
      const commentCount = toNumber(item.statistics?.commentCount);

      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description ?? "",
        thumbnail:
          item.snippet.thumbnails?.maxres?.url ??
          item.snippet.thumbnails?.standard?.url ??
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          "",
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails.duration,
        durationSeconds,
        viewCount,
        likeCount,
        commentCount,
        viralScore: calculateViralScore({
          viewCount,
          likeCount,
          commentCount,
          publishedAt: item.snippet.publishedAt,
          durationSeconds
        })
      };
    }) ?? [];

  return videos.sort((a, b) => b.viralScore - a.viralScore);
}

async function youtubeGet<T>(resource: string, params: Record<string, string>): Promise<T> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new YouTubeApiError(
      "Missing YouTube API key. Add YOUTUBE_API_KEY to .env.local.",
      500,
      "missingApiKey"
    );
  }

  const url = new URL(`${YOUTUBE_API_BASE}/${resource}`);
  url.searchParams.set("key", apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json"
      },
      next: {
        revalidate: 300
      }
    });
  } catch {
    throw new YouTubeApiError(
      "Unable to reach the YouTube Data API. Check your network connection and try again.",
      502,
      "networkError"
    );
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const reason = body?.error?.errors?.[0]?.reason ?? body?.error?.status;
    const rawMessage = body?.error?.message;
    const message = getFriendlyYouTubeError(reason, rawMessage);
    throw new YouTubeApiError(message, response.status, reason);
  }

  return body as T;
}

function getFriendlyYouTubeError(reason?: string, rawMessage?: string): string {
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
    return "YouTube API quota exceeded. Try again later or use another API key.";
  }

  if (reason === "keyInvalid" || reason === "badRequest") {
    return "The YouTube API key could not be used for this request.";
  }

  if (reason === "forbidden") {
    return "YouTube rejected this API request. Check API key permissions.";
  }

  return rawMessage ?? "YouTube API request failed.";
}

function toNumber(value?: string): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}
