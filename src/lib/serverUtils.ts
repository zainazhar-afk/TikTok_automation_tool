import { execSync } from "child_process";

/**
 * Locates the native FFmpeg binary on the server.
 * Checks FFMPEG_PATH env var first, then falls back to PATH.
 */
export function getFFmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  return "ffmpeg"; // rely on PATH
}

/**
 * Locates ffprobe (used for metadata extraction). Falls back to ffmpeg detection.
 */
export function getFFprobePath(): string {
  if (process.env.FFPROBE_PATH) return process.env.FFPROBE_PATH;
  return "ffprobe";
}

let _ffmpegAvailable: boolean | null = null;

/**
 * Checks if native FFmpeg is available on the server.
 * Caches the result for the lifetime of the process.
 */
export function isFFmpegAvailable(): boolean {
  if (_ffmpegAvailable !== null) return _ffmpegAvailable;

  try {
    const ffmpegPath = getFFmpegPath();
    execSync(`"${ffmpegPath}" -version`, { stdio: "ignore", timeout: 5000 });
    _ffmpegAvailable = true;
  } catch {
    _ffmpegAvailable = false;
  }

  return _ffmpegAvailable;
}

/**
 * Re-checks FFmpeg availability (clears cache, then checks).
 * Useful after server admin installs FFmpeg without restarting the process.
 */
export function refreshFFmpegAvailability(): boolean {
  _ffmpegAvailable = null;
  return isFFmpegAvailable();
}
