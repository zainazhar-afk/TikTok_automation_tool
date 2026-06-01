import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { getTempPath, tempFileExists } from "@/lib/tempFiles";
import { getFFmpegPath, isFFmpegAvailable } from "@/lib/serverUtils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!isFFmpegAvailable()) {
    return NextResponse.json(
      { error: "FFmpeg is not installed on this server." },
      { status: 503 }
    );
  }

  const inputPath = getTempPath(videoId, ".mp4");
  if (!tempFileExists(videoId, ".mp4")) {
    return NextResponse.json(
      { error: "Video file not found. It may have expired." },
      { status: 404 }
    );
  }

  const ffmpegPath = getFFmpegPath();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const child = spawn(ffmpegPath, [
        "-ss", "3",                  // 3 seconds in — skip intros
        "-i", inputPath,
        "-vframes", "1",             // single frame
        "-f", "mjpeg",              // JPEG output
        "-q:v", "3",                // good quality
        "-vf", "scale=360:640:force_original_aspect_ratio=decrease", // thumbnail size
        "pipe:1"                     // stdout
      ], {
        stdio: ["ignore", "pipe", "ignore"]
      });

      child.stdout.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });

      child.stdout.on("end", () => {
        controller.close();
      });

      child.stdout.on("error", (err) => {
        controller.error(err);
      });

      child.on("close", (code) => {
        if (code !== 0) {
          controller.error(new Error("Thumbnail generation failed."));
        }
      });
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
