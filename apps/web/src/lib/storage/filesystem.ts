import {
  mkdir,
  readFile,
  writeFile,
  unlink,
  access,
  stat,
  readdir,
  rm,
} from "fs/promises";
import { dirname, join } from "path";
import type { BlobStorage, BlobStat } from "./index";

/**
 * Get the data directory path from environment or use default.
 */
function getDataDir(): string {
  return process.env.DATA_DIR || "./data";
}

/**
 * Filesystem-based blob storage implementation.
 * Stores blobs as files on disk. Suitable for development and single-server production.
 */
export function createFilesystemStorage(): BlobStorage {
  const dataDir = getDataDir();

  return {
    async get(key: string): Promise<Buffer | null> {
      const path = join(dataDir, key);
      try {
        return await readFile(path);
      } catch (e) {
        const error = e as NodeJS.ErrnoException;
        if (error.code === "ENOENT") {
          return null;
        }
        throw e;
      }
    },

    async put(key: string, data: Buffer): Promise<void> {
      const path = join(dataDir, key);
      // Ensure parent directory exists
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, data);
    },

    async delete(key: string): Promise<void> {
      const path = join(dataDir, key);
      try {
        await unlink(path);
      } catch (e) {
        const error = e as NodeJS.ErrnoException;
        // Ignore "file not found" errors
        if (error.code !== "ENOENT") {
          throw e;
        }
      }
    },

    async exists(key: string): Promise<boolean> {
      const path = join(dataDir, key);
      try {
        await access(path);
        return true;
      } catch {
        return false;
      }
    },

    async stat(key: string): Promise<BlobStat | null> {
      const path = join(dataDir, key);
      try {
        const stats = await stat(path);
        return {
          sizeBytes: stats.size,
          lastModified: stats.mtime,
        };
      } catch (e) {
        const error = e as NodeJS.ErrnoException;
        if (error.code === "ENOENT") {
          return null;
        }
        throw e;
      }
    },
  };
}

/**
 * List all files in a directory (for pending sync cleanup, etc.)
 */
export async function listFiles(dirKey: string): Promise<string[]> {
  const dataDir = getDataDir();
  const path = join(dataDir, dirKey);
  try {
    const files = await readdir(path);
    return files.map((f) => join(dirKey, f));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return [];
    }
    throw e;
  }
}

/**
 * Delete a directory and all its contents.
 */
export async function deleteDir(dirKey: string): Promise<void> {
  const dataDir = getDataDir();
  const path = join(dataDir, dirKey);
  try {
    await rm(path, { recursive: true, force: true });
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      throw e;
    }
  }
}

