import { spawn } from "child_process";
import { NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { createTempFileId } from "@/lib/tempFiles";

function getYtDlpPath(): string {
  // Allow explicit override via environment variable
  if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;

  // Common Windows user-install location
  const roaming = process.env.APPDATA;
  if (roaming) {
    const candidates = [
      `${roaming}\\Python\\Python314\\Scripts\\yt-dlp.exe`,
      `${roaming}\\Python\\Python313\\Scripts\\yt-dlp.exe`,
      `${roaming}\\Python\\Python312\\Scripts\\yt-dlp.exe`
    ];
    for (const candidate of candidates) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("fs").accessSync(candidate);
        return candidate;
      } catch {
        // not found, try next
      }
    }
  }

  // Fall back to "yt-dlp" on PATH (works on macOS/Linux and some Windows setups)
  return "yt-dlp";
}

const YT_DLP = getYtDlpPath();

function parseYouTubeVideoUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Enter a YouTube video URL first.");
  }

  const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  let url: URL;

  try {
    url = new URL(normalized);
  } catch {
    throw new Error("Enter a valid YouTube video URL.");
  }

  const host = url.hostname.replace(/^www\./, "");
  if (!["youtube.com", "m.youtube.com", "youtu.be"].includes(host)) {
    throw new Error("Use a youtube.com or youtu.be video URL.");
  }

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (!id) throw new Error("Could not extract a video id from this URL.");
    return `https://www.youtube.com/watch?v=${id}`;
  }

  const videoId = url.searchParams.get("v");
  if (!videoId) {
    throw new Error("Could not find a video id in this URL. Use a /watch?v=... URL.");
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    throw new Error("This does not look like a valid YouTube video id.");
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get video metadata using yt-dlp --dump-json.
 */
function getVideoInfo(url: string): Promise<{ title: string; duration: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(YT_DLP, ["--dump-json", "--no-playlist", url], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const errMsg = stderr.trim() || "yt-dlp failed to fetch video metadata.";
        reject(new Error(errMsg));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        resolve({
          title: info.title || "youtube_video",
          duration: Math.round(info.duration || 0)
        });
      } catch {
        reject(new Error("Failed to parse video metadata from yt-dlp."));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start yt-dlp: ${err.message}`));
    });
  });
}

// ── aria2c detection ────────────────────────────────────────────────

function getAria2cPath(): string {
  if (process.env.ARIA2C_PATH) return process.env.ARIA2C_PATH;
  return "aria2c"; // rely on PATH
}

let aria2cAvailable: boolean | null = null;

async function checkAria2c(): Promise<boolean> {
  if (aria2cAvailable !== null) return aria2cAvailable;

  return new Promise((resolve) => {
    const child = spawn(getAria2cPath(), ["--version"], {
      stdio: "ignore",
      timeout: 5000
    });
    child.on("close", (code) => {
      aria2cAvailable = code === 0;
      resolve(aria2cAvailable!);
    });
    child.on("error", () => {
      aria2cAvailable = false;
      resolve(false);
    });
  });
}

/**
 * Download a YouTube video using yt-dlp.
 * When outputPath is provided, saves to a file on disk (for temp storage).
 * When outputPath is null, streams to stdout for piping to the HTTP response.
 * When aria2c is available, uses it for parallel chunked downloading (like IDM).
 */
async function streamVideo(
  url: string,
  outputPath?: string
): Promise<{
  stream: ReadableStream<Uint8Array>;
  kill: () => void;
  stderrPromise: Promise<string>;
  downloader: string;
  outputPath?: string;
}> {
  const useAria2c = await checkAria2c();

  const args = [
    "-f",
    "best[ext=mp4]/best",
    "--no-playlist"
  ];

  if (outputPath) {
    // Save to file instead of stdout
    args.push("-o", outputPath);
  } else {
    args.push("-o", "-");
  }

  if (useAria2c) {
    args.push(
      "--downloader", "aria2c",
      "--downloader-args", "aria2c:-x 8 -s 8 -k 1M"
    );
  }

  args.push(url);

  const child = spawn(YT_DLP, args, {
    stdio: outputPath ? ["ignore", "ignore", "pipe"] : ["ignore", "pipe", "pipe"]
  });

  let stderr = "";

  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  const stderrPromise = new Promise<string>((resolve) => {
    child.on("close", () => resolve(stderr));
  });

  // When saving to file, create a minimal stream that just signals completion
  // When streaming, pipe stdout to the ReadableStream
  const stream = outputPath
    ? new ReadableStream<Uint8Array>({
        start(controller) {
          child.on("close", (code) => {
            if (code === 0) {
              controller.close();
            } else {
              controller.error(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
            }
          });
          child.on("error", (err) => controller.error(err));
        }
      })
    : new ReadableStream<Uint8Array>({
        start(controller) {
          child.stdout!.on("data", (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          child.stdout!.on("end", () => controller.close());
          child.stdout!.on("error", (err) => controller.error(err));
          child.on("close", (code) => {
            if (code !== 0 && stderr) {
              console.error("[yt-dlp download error]", stderr.trim());
            }
          });
        },
        cancel() {
          child.kill("SIGTERM");
        }
      });

  return {
    stream,
    kill: () => child.kill("SIGTERM"),
    stderrPromise,
    downloader: useAria2c ? "aria2c" : "native",
    outputPath
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { videoUrl?: string };

    if (!body.videoUrl) {
      return NextResponse.json(
        { error: "Enter a YouTube video URL first." },
        { status: 400 }
      );
    }

    const normalizedUrl = parseYouTubeVideoUrl(body.videoUrl);

    // Step 1: Get video metadata
    let info: { title: string; duration: number };
    try {
      info = await getVideoInfo(normalizedUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch video info.";
      // Map common yt-dlp errors to user-friendly messages
      if (message.includes("Video unavailable") || message.includes("Private video")) {
        return NextResponse.json(
          { error: "This video is unavailable. It may be private, age-restricted, or region-locked." },
          { status: 400 }
        );
      }
      if (message.includes("inappropriate") || message.includes("age restriction")) {
        return NextResponse.json(
          { error: "This video is age-restricted and cannot be downloaded." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const safeFilename = info.title.replace(/[<>:"/\\|?*]+/g, "_").trim() || "youtube_video";
    const filename = `${safeFilename}.mp4`;

    // Step 2: Download — temp save for server processing, or stream for direct download
    const { searchParams } = new URL(request.url);
    const saveMode = searchParams.get("save");

    if (saveMode === "temp") {
      // Save to .temp/ directory for server-side processing
      const { id, path } = createTempFileId(".mp4");
      const { stderrPromise, downloader } = await streamVideo(normalizedUrl, path);

      // Wait for download to complete
      await stderrPromise;

      return NextResponse.json({
        tempId: id,
        title: info.title,
        name: safeFilename,
        duration: info.duration,
        downloader
      });
    }

    // Default: stream directly to client (original behavior)
    const { stream, downloader } = await streamVideo(normalizedUrl);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "X-Video-Title": encodeURIComponent(info.title),
        "X-Video-Duration": String(info.duration),
        "X-Downloader": downloader
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Unable to download this YouTube video." },
      { status: 500 }
    );
  }
}
