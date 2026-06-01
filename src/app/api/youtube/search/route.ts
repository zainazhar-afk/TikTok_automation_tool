import { spawn } from "child_process";
import { NextResponse } from "next/server";
import type { YouTubeVideo } from "@/types/youtube";

// ── yt-dlp detection ───────────────────────────────────────────────

const YT_DLP = process.env.YT_DLP_PATH || "yt-dlp";

// ── Cache ──────────────────────────────────────────────────────────

const cache = new Map<
  string,
  { videos: YouTubeVideo[]; expiry: number }
>();

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ── Helpers ────────────────────────────────────────────────────────

function getTimeAgo(uploadDate: string): string {
  const now = Date.now();
  const uploaded = new Date(
    parseInt(uploadDate.slice(0, 4), 10),
    parseInt(uploadDate.slice(4, 6), 10) - 1,
    parseInt(uploadDate.slice(6, 8), 10)
  ).getTime();

  const days = Math.floor((now - uploaded) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/** Converts ISO 8601 duration (PT1M30S) to seconds and a display string */
function parseDuration(iso: string): { seconds: number; display: string } {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { seconds: 0, display: "0:00" };

  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  const total = h * 3600 + m * 60 + s;

  if (h > 0) return { seconds: total, display: `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
  return { seconds: total, display: `${m}:${String(s).padStart(2, "0")}` };
}

// ── yt-dlp search ──────────────────────────────────────────────────

interface YtDlpVideo {
  id: string;
  title: string;
  duration: number | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  upload_date: string | null;
  channel: string;
  channel_id: string;
  thumbnail: string;
  description: string;
}

async function searchViaYtDlp(query: string): Promise<YouTubeVideo[]> {
  const searchQuery = `ytsearch50:${query}`;

  return new Promise((resolve, reject) => {
    const child = spawn(
      YT_DLP,
      [
        searchQuery,
        "--dump-json",
        "--flat-playlist",
        "--no-playlist",
        "--extractor-args", "youtubetab:skip=authcheck"
      ],
      {
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(stderr.trim() || `yt-dlp search failed with code ${code}`));
        return;
      }

      try {
        const lines = stdout.trim().split("\n").filter(Boolean);
        const rawVideos: YtDlpVideo[] = lines.map((line) => JSON.parse(line));

        // Map to YouTubeVideo format
        const now = Date.now();

        const videos: YouTubeVideo[] = rawVideos
          .filter((v) => v.id && v.title)
          .map((v) => {
            const dur = v.duration ? parseDuration(`PT${Math.floor(v.duration)}S`) : { seconds: 0, display: "?" };
            const uploadDate = v.upload_date || "";
            const daysSinceUpload = uploadDate
              ? Math.max(
                  1,
                  Math.floor(
                    (now -
                      new Date(
                        parseInt(uploadDate.slice(0, 4), 10),
                        parseInt(uploadDate.slice(4, 6), 10) - 1,
                        parseInt(uploadDate.slice(6, 8), 10)
                      ).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 30;

            const viewCount = v.view_count ?? 0;
            const likeCount = v.like_count ?? 0;
            const commentCount = v.comment_count ?? 0;

            // Viral score: velocity (views/day) × engagement rate
            const velocity = viewCount / daysSinceUpload;
            const engagement = viewCount > 0 ? likeCount / viewCount : 0;
            const viralScore = (velocity / 1000) * (engagement * 1000 + 1);

            return {
              id: v.id,
              title: v.title,
              description: v.description || "",
              thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
              publishedAt: uploadDate ? getTimeAgo(uploadDate) : "Unknown",
              duration: dur.display,
              durationSeconds: dur.seconds,
              viewCount,
              likeCount,
              commentCount,
              viralScore: Math.round(viralScore * 100) / 100
            };
          });

        // Filter: keep videos from last 30 days (or all if we don't have dates)
        const recent = videos.filter((v) => {
          if (!v.publishedAt || v.publishedAt === "Unknown") return true;
          return !v.publishedAt.includes("month");
        });

        // Deduplicate: max 2 videos per channel
        const channelCounts = new Map<string, number>();
        const deduped = recent.filter((v) => {
          const channel = rawVideos.find((rv) => rv.id === v.id)?.channel_id || v.id;
          const count = channelCounts.get(channel) || 0;
          if (count >= 2) return false;
          channelCounts.set(channel, count + 1);
          return true;
        });

        // Sort by viral score descending
        deduped.sort((a, b) => b.viralScore - a.viralScore);

        resolve(deduped.slice(0, 30));
      } catch (err) {
        reject(new Error(`Failed to parse yt-dlp search results: ${err instanceof Error ? err.message : String(err)}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start yt-dlp: ${err.message}`));
    });
  });
}

// ── Route handler ──────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required. Use ?q=niche" },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json({
      videos: cached.videos,
      source: "cache",
      total: cached.videos.length
    });
  }

  try {
    const videos = await searchViaYtDlp(query);

    // Cache the result
    cache.set(cacheKey, {
      videos,
      expiry: Date.now() + CACHE_TTL_MS
    });

    return NextResponse.json({
      videos,
      source: "ytsearch",
      total: videos.length
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";

    // If yt-dlp fails, try returning cached results even if expired
    if (cached) {
      return NextResponse.json({
        videos: cached.videos,
        source: "stale-cache",
        total: cached.videos.length,
        warning: "Live search unavailable. Showing cached results."
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Also accept POST (same params as the existing trending route)
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    niche?: string;
  };

  const query = body.niche?.trim() || "shorts";
  const { searchParams } = new URL(`http://localhost?q=${encodeURIComponent(query)}`);
  const req = new Request(`http://localhost/api/youtube/search?q=${encodeURIComponent(query)}`);

  // Forward to GET handler
  return GET(req);
}
