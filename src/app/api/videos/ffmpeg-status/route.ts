import { NextResponse } from "next/server";
import { isFFmpegAvailable } from "@/lib/serverUtils";
import { getTempDirSize } from "@/lib/tempFiles";

export async function GET() {
  const ffmpegAvailable = isFFmpegAvailable();
  const tempDirBytes = getTempDirSize();

  return NextResponse.json({
    available: ffmpegAvailable,
    tempDirBytes,
    tempDirMB: Math.round((tempDirBytes / (1024 * 1024)) * 100) / 100
  });
}
