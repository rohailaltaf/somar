/**
 * In-memory storage mock for testing.
 * Implements the BlobStorage interface without touching the filesystem.
 */

import type { BlobStorage, BlobStat } from "@/lib/storage";

export class MockStorage implements BlobStorage {
  private data = new Map<string, { buffer: Buffer; lastModified: Date }>();

  // Track calls for assertions
  public getCalls: string[] = [];
  public putCalls: Array<{ key: string; size: number }> = [];
  public deleteCalls: string[] = [];
  public existsCalls: string[] = [];

  async get(key: string): Promise<Buffer | null> {
    this.getCalls.push(key);
    const entry = this.data.get(key);
    return entry ? entry.buffer : null;
  }

  async put(key: string, data: Buffer): Promise<void> {
    this.putCalls.push({ key, size: data.length });
    this.data.set(key, { buffer: data, lastModified: new Date() });
  }

  async delete(key: string): Promise<void> {
    this.deleteCalls.push(key);
    this.data.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    this.existsCalls.push(key);
    return this.data.has(key);
  }

  async stat(key: string): Promise<BlobStat | null> {
    const entry = this.data.get(key);
    if (!entry) return null;
    return {
      sizeBytes: entry.buffer.length,
      lastModified: entry.lastModified,
    };
  }

  /**
   * Reset all data and call tracking for a fresh test.
   */
  reset(): void {
    this.data.clear();
    this.getCalls = [];
    this.putCalls = [];
    this.deleteCalls = [];
    this.existsCalls = [];
  }

  /**
   * Get stored data for assertions.
   */
  getStoredData(key: string): Buffer | null {
    return this.data.get(key)?.buffer ?? null;
  }

  /**
   * Check if any data is stored.
   */
  hasData(): boolean {
    return this.data.size > 0;
  }
}

// Singleton instance for tests
export const mockStorage = new MockStorage();
