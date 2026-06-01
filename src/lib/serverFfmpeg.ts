import { spawn } from "child_process";
import { getFFmpegPath } from "@/lib/serverUtils";
import type { AspectRatio, TextOverlay } from "@/types/editor";

export type ServerExportOptions = {
  inputPath: string;
  outputPath: string;
  trimStart: number;
  trimEnd: number;
  speed: number;
  brightness: number;
  contrast: number;
  saturation: number;
  aspectRatio: AspectRatio;
  volume: number;
  muted: boolean;
  textOverlay?: TextOverlay;
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(6, "0")}`;
}

function scaleFilter(
  aspectRatio: AspectRatio
): string | null {
  switch (aspectRatio) {
    case "9:16":
      // Crop center to 9:16 portrait
      return "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
    case "1:1":
      return "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080";
    case "16:9":
      return "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080";
    default:
      return null;
  }
}

function drawTextFilter(text: TextOverlay): string {
  const escaped = text.text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\\\\\'")
    .replace(/%/g, "\\\\\\%");

  let y = "(h-text_h)/2"; // center default
  if (text.position === "top") y = "text_h + 24";
  else if (text.position === "bottom") y = "h - text_h - 24";

  const color = text.color || "#ffffff";
  const fontSize = text.fontSize || 52;
  const borderColor = "black";
  const borderW = Math.max(1, Math.round(fontSize / 16));

  return (
    `drawtext=text='${escaped}':` +
    `fontsize=${fontSize}:` +
    `fontcolor=${color}:` +
    `bordercolor=${borderColor}:` +
    `borderw=${borderW}:` +
    `x=(w-text_w)/2:` +
    `y=${y}:` +
    `fontfile=/Windows/Fonts/arial.ttf`
  );
}

export async function processVideoServer(
  options: ServerExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> {
  const ffmpegPath = getFFmpegPath();
  const args: string[] = [];

  args.push("-y"); // overwrite output

  // Input
  args.push("-ss", formatTime(options.trimStart));
  args.push("-i", options.inputPath);
  args.push("-t", formatTime(Math.max(0.1, options.trimEnd - options.trimStart)));

  // Video filters
  const filters: string[] = [];

  // Aspect ratio scaling
  const scale = scaleFilter(options.aspectRatio);
  if (scale) filters.push(scale);

  // Speed (setpts)
  if (options.speed !== 1 && options.speed > 0) {
    filters.push(`setpts=${(1 / options.speed).toFixed(4)}*PTS`);
  }

  // Color adjustments
  const eqParts: string[] = [];
  if (options.brightness !== 0) eqParts.push(`brightness=${options.brightness.toFixed(2)}`);
  if (options.contrast !== 0) {
    const c = Math.max(0, 1 + options.contrast).toFixed(2);
    eqParts.push(`contrast=${c}`);
  }
  if (options.saturation !== 0) {
    const s = Math.max(0, 1 + options.saturation).toFixed(2);
    eqParts.push(`saturation=${s}`);
  }
  if (eqParts.length > 0) filters.push(`eq=${eqParts.join(":")}`);

  // Text overlay
  if (options.textOverlay?.text.trim()) {
    filters.push(drawTextFilter(options.textOverlay));
  }

  if (filters.length > 0) {
    args.push("-filter:v", filters.join(","));
  }

  // Audio
  if (options.muted) {
    args.push("-an");
  } else {
    // Audio speed
    if (options.speed !== 1 && options.speed > 0) {
      args.push("-filter:a", `atempo=${options.speed.toFixed(4)}`);
    }
    // Volume
    if (options.volume !== 100) {
      const volFilter = `volume=${(options.volume / 100).toFixed(2)}`;
      if (args[args.length - 1] === "-filter:a") {
        args[args.length - 1] = "-filter:a";
        args.push(`${args.pop()},${volFilter}`);
      }
      // If we added atempo filter, append volume to it
      // If no audio filter yet, add one
      const filterAIndex = args.indexOf("-filter:a");
      if (filterAIndex >= 0) {
        args[filterAIndex + 1] = args[filterAIndex + 1] + `,${volFilter}`;
      } else {
        args.push("-filter:a", volFilter);
      }
    }
  }

  // Map streams
  args.push("-map", "0:v:0");
  if (!options.muted) args.push("-map", "0:a?");

  // Output codec
  args.push("-c:v", "libx264", "-preset", "fast", "-crf", "23");
  args.push("-c:a", "aac", "-b:a", "128k");
  args.push("-movflags", "+faststart");

  // Progress parsing
  args.push("-progress", "pipe:1");

  args.push(options.outputPath);

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    // Parse progress from stdout (ffmpeg -progress pipe:1)
    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      const timeMatch = text.match(/out_time_us=(\d+)/);
      if (timeMatch && onProgress) {
        const outUs = parseInt(timeMatch[1], 10);
        const totalUs = (options.trimEnd - options.trimStart) * 1_000_000;
        const pct = Math.min(100, Math.round((outUs / totalUs) * 100));
        onProgress(pct);
      }
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Extract the last meaningful line from stderr
        const lines = stderr.trim().split("\n");
        const lastError = lines[lines.length - 1] || "Unknown FFmpeg error";
        reject(new Error(`FFmpeg exited with code ${code}: ${lastError}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });
  });
}
