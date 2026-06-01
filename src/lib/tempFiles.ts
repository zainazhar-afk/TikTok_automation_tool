import { randomUUID } from "crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import { basename, join } from "path";

const TEMP_DIR = join(process.cwd(), ".temp");

function ensureTempDir(): void {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

ensureTempDir();

/**
 * Creates a temp file and returns its ID and absolute path.
 * The ID is a UUID used to reference the file across API routes.
 */
export function createTempFileId(ext: string): { id: string; path: string } {
  ensureTempDir();
  const id = randomUUID();
  const filename = ext.startsWith(".") ? `${id}${ext}` : `${id}.${ext}`;
  const path = join(TEMP_DIR, filename);
  return { id, path };
}

/**
 * Resolves a temp file ID + extension to its absolute path.
 */
export function getTempPath(id: string, ext: string): string {
  const filename = ext.startsWith(".") ? `${id}${ext}` : `${id}.${ext}`;
  return join(TEMP_DIR, filename);
}

/**
 * Checks if a temp file exists.
 */
export function tempFileExists(id: string, ext: string): boolean {
  return existsSync(getTempPath(id, ext));
}

/**
 * Creates a writable stream to a temp file.
 */
export function createTempWriteStream(id: string, ext: string) {
  ensureTempDir();
  const path = getTempPath(id, ext);
  return createWriteStream(path);
}

/**
 * Creates a readable stream from a temp file.
 */
export function createTempReadStream(id: string, ext: string) {
  const path = getTempPath(id, ext);
  return createReadStream(path);
}

/**
 * Deletes a specific temp file by ID + extension.
 * Safe to call on non-existent files (no error thrown).
 */
export function deleteTempFile(id: string, ext: string): void {
  const path = getTempPath(id, ext);
  try {
    if (existsSync(path)) {
      unlinkSync(path);
    }
  } catch {
    // ignore — file may already be gone
  }
}

/**
 * Deletes all temp files older than maxAgeMs (default 30 minutes).
 * Call periodically (e.g., on each API request or via a cron job).
 */
export function cleanupOldTempFiles(maxAgeMs = 30 * 60 * 1000): number {
  ensureTempDir();
  const now = Date.now();
  let deleted = 0;

  try {
    const files = readdirSync(TEMP_DIR);
    for (const file of files) {
      const fullPath = join(TEMP_DIR, file);
      try {
        const stat = statSync(fullPath);
        if (now - stat.mtimeMs > maxAgeMs) {
          unlinkSync(fullPath);
          deleted++;
        }
      } catch {
        // file may be locked or already deleted — skip
      }
    }
  } catch {
    // directory may not exist
  }

  return deleted;
}

/**
 * Returns total size of temp directory in bytes (for monitoring).
 */
export function getTempDirSize(): number {
  ensureTempDir();
  let total = 0;
  try {
    const files = readdirSync(TEMP_DIR);
    for (const file of files) {
      try {
        total += statSync(join(TEMP_DIR, file)).size;
      } catch {
        // skip
      }
    }
  } catch {
    // skip
  }
  return total;
}

export { TEMP_DIR };
