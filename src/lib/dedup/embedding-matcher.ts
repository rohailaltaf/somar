/**
 * Embedding-based Transaction Matching
 *
 * Uses OpenAI's text-embedding-3-small model for semantic similarity.
 * This catches matches that string algorithms miss, like:
 * - "Chipotle Mexican Grill" vs "CHIPOTLE 1249"
 * - "Raising Cane's Chicken Fingers" vs "RAISING CANES 0724"
 */

import OpenAI from "openai";

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for embedding-based deduplication"
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// In-memory cache for embeddings during a single import session
// Key: normalized description, Value: embedding vector
const embeddingCache = new Map<string, number[]>();

/**
 * Get embedding for a single text string.
 * Uses text-embedding-3-small: $0.00002 per 1K tokens
 *
 * @param text The text to embed
 * @returns Embedding vector (1536 dimensions)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const normalized = text.toLowerCase().trim();

  // Check cache first
  const cached = embeddingCache.get(normalized);
  if (cached) {
    return cached;
  }

  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: normalized,
  });

  const embedding = response.data[0].embedding;

  // Cache the result
  embeddingCache.set(normalized, embedding);

  return embedding;
}

/**
 * Get embeddings for multiple texts in a batch (more efficient).
 * OpenAI supports up to 2048 texts per batch.
 *
 * @param texts Array of texts to embed
 * @returns Map of text -> embedding
 */
export async function getEmbeddingsBatch(
  texts: string[]
): Promise<Map<string, number[]>> {
  const results = new Map<string, number[]>();
  const textsToFetch: string[] = [];
  const normalizedTexts: string[] = [];

  // Check cache first
  for (const text of texts) {
    const normalized = text.toLowerCase().trim();
    normalizedTexts.push(normalized);

    const cached = embeddingCache.get(normalized);
    if (cached) {
      results.set(text, cached);
    } else {
      textsToFetch.push(normalized);
    }
  }

  // Fetch uncached embeddings
  if (textsToFetch.length > 0) {
    const openai = getOpenAIClient();

    // Batch in chunks of 100 for safety
    const chunkSize = 100;
    for (let i = 0; i < textsToFetch.length; i += chunkSize) {
      const chunk = textsToFetch.slice(i, i + chunkSize);

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });

      // Map results back
      for (let j = 0; j < response.data.length; j++) {
        const embedding = response.data[j].embedding;
        const originalText = chunk[j];
        embeddingCache.set(originalText, embedding);
      }
    }

    // Now get all from cache
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!results.has(text)) {
        const normalized = normalizedTexts[i];
        const embedding = embeddingCache.get(normalized);
        if (embedding) {
          results.set(text, embedding);
        }
      }
    }
  }

  return results;
}

/**
 * Calculate cosine similarity between two embedding vectors.
 * Returns a value between -1 and 1 (usually 0 to 1 for text embeddings).
 *
 * @param a First embedding vector
 * @param b Second embedding vector
 * @returns Cosine similarity score
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embedding vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Clear the embedding cache.
 * Call this after an import is complete to free memory.
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}
