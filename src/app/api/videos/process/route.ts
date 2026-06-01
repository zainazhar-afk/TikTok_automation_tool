import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import {
  processVideoServer,
  type ServerExportOptions
} from "@/lib/serverFfmpeg";
import {
  createTempFileId,
  getTempPath,
  deleteTempFile,
  cleanupOldTempFiles
} from "@/lib/tempFiles";
import { isFFmpegAvailable } from "@/lib/serverUtils";

export async function POST(request: Request) {
  // Cleanup old files on each request (lightweight)
  cleanupOldTempFiles();

  if (!isFFmpegAvailable()) {
    return NextResponse.json(
      { error: "FFmpeg is not installed on this server. Use client-side processing instead." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    const videoId = body.videoId as string;
    const trimStart = Number(body.trimStart ?? 0);
    const trimEnd = Number(body.trimEnd ?? 15);
    const speed = Number(body.speed ?? 1);
    const brightness = Number(body.brightness ?? 0);
    const contrast = Number(body.contrast ?? 0);
    const saturation = Number(body.saturation ?? 0);
    const aspectRatio = (body.aspectRatio ?? "9:16") as ServerExportOptions["aspectRatio"];
    const volume = Number(body.volume ?? 100);
    const muted = Boolean(body.muted ?? false);
    const textOverlay = body.textOverlay?.text?.trim()
      ? (body.textOverlay as ServerExportOptions["textOverlay"])
      : undefined;

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId (temp file ID) is required." },
        { status: 400 }
      );
    }

    const inputPath = getTempPath(videoId, ".mp4");
    const outputId = createTempFileId(".mp4");

    const options: ServerExportOptions = {
      inputPath,
      outputPath: outputId.path,
      trimStart,
      trimEnd,
      speed,
      brightness,
      contrast,
      saturation,
      aspectRatio,
      volume,
      muted,
      textOverlay
    };

    // Process with native FFmpeg, report progress
    let lastProgress = 0;
    await processVideoServer(options, (progress) => {
      lastProgress = progress;
    });

    // Get file size
    const fileStat = await stat(outputId.path);

    // Stream the processed file back
    const stream = createReadStream(outputId.path);

    // Clean up the output file after streaming
    stream.on("close", () => {
      deleteTempFile(outputId.id, ".mp4");
    });
    stream.on("error", () => {
      deleteTempFile(outputId.id, ".mp4");
    });

    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(fileStat.size),
        "X-Processed-By": "server-ffmpeg",
        "X-Output-Id": outputId.id
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
