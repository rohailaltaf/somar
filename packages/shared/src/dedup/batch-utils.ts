/**
 * Batch utilities for deduplication
 */

/** Maximum pairs per API request for LLM verification */
export const LLM_API_BATCH_LIMIT = 100;

/**
 * Split an array into chunks of specified size
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
