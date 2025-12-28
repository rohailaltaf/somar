import { createFilesystemStorage } from "./filesystem";

/**
 * Blob storage abstraction for user encrypted databases and sync data.
 * Start with filesystem storage for development and simple production.
 * Can be swapped for S3/R2 later by implementing the same interface.
 */
export interface BlobStorage {
  /**
   * Get a blob by key. Returns null if not found.
   */
  get(key: string): Promise<Buffer | null>;

  /**
   * Store a blob at the given key. Creates parent directories if needed.
   */
  put(key: string, data: Buffer): Promise<void>;

  /**
   * Delete a blob by key. No-op if not found.
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a blob exists at the given key.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get metadata about a blob (size, last modified).
   */
  stat(key: string): Promise<BlobStat | null>;
}

export interface BlobStat {
  sizeBytes: number;
  lastModified: Date;
}

/**
 * Create the storage backend based on environment configuration.
 * Default to filesystem storage.
 */
export function createStorage(): BlobStorage {
  const storageType = process.env.STORAGE_TYPE || "filesystem";

  if (storageType === "filesystem") {
    return createFilesystemStorage();
  }

  // Future: add S3/R2 support
  // if (storageType === "s3") {
  //   return createS3Storage();
  // }

  throw new Error(`Unknown storage type: ${storageType}`);
}

// Singleton storage instance
let _storage: BlobStorage | null = null;

export function getStorage(): BlobStorage {
  if (!_storage) {
    _storage = createStorage();
  }
  return _storage;
}

// Default storage instance for convenience
export const storage = getStorage();

