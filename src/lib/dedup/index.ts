/**
 * World-Class Transaction Deduplication Engine
 *
 * A 3-tier matching system that progressively uses more sophisticated methods:
 *
 * Tier 1: Deterministic (instant, free)
 *   - Merchant name extraction + Jaro-Winkler similarity
 *   - Threshold: 0.88
 *
 * Tier 2: Embedding Similarity (fast, cheap)
 *   - OpenAI text-embedding-3-small
 *   - Threshold: 0.82
 *
 * Tier 3: LLM Verification (accurate, slightly more expensive)
 *   - GPT-4o-mini for uncertain cases (0.65-0.82 embedding similarity)
 *   - Batch processing for efficiency
 */

import {
  extractMerchantName,
  hasSignificantTokenOverlap,
} from "./merchant-extractor";
import { jaroWinkler, combinedSimilarity } from "./jaro-winkler";
import {
  getEmbedding,
  getEmbeddingsBatch,
  cosineSimilarity,
  clearEmbeddingCache,
} from "./embedding-matcher";
import { verifyMatchesBatch, isLLMAvailable } from "./llm-verifier";

// Re-export utilities
export { extractMerchantName } from "./merchant-extractor";
export { jaroWinkler, combinedSimilarity } from "./jaro-winkler";
export { clearEmbeddingCache } from "./embedding-matcher";

/**
 * Transaction data structure for deduplication
 */
export interface TransactionForDedup {
  id?: string;
  description: string;
  amount: number;
  date: string;
  // Plaid-specific dates for accurate matching
  // For Plaid transactions: authorized_date = when purchased (matches CSV), posted_date = when posted
  // For CSV transactions: these are undefined
  plaidAuthorizedDate?: string | null;
  plaidPostedDate?: string | null;
  // Plaid merchant name - often cleaner than description (e.g., "Amazon Web Services" vs "AWS")
  plaidMerchantName?: string | null;
}

/**
 * Result of duplicate detection for a single transaction
 */
export interface DedupeResult {
  isUnique: boolean;
  matchedTransaction?: TransactionForDedup;
  confidence: number;
  matchTier: "deterministic" | "embedding" | "llm" | "none";
}

/**
 * Result of batch deduplication
 */
export interface BatchDedupeResult {
  unique: TransactionForDedup[];
  duplicates: Array<{
    transaction: TransactionForDedup;
    matchedWith: TransactionForDedup;
    confidence: number;
    matchTier: "deterministic" | "embedding" | "llm";
  }>;
  stats: {
    total: number;
    unique: number;
    duplicates: number;
    tier1Matches: number;
    tier2Matches: number;
    tier3Matches: number;
    processingTimeMs: number;
  };
}

// Thresholds for each tier
const TIER1_THRESHOLD = 0.88; // Jaro-Winkler threshold
const TIER2_THRESHOLD = 0.82; // Embedding cosine similarity - auto-match if above this

/**
 * Tier 1: Deterministic matching using merchant extraction and string similarity.
 * Fast and free - always runs first.
 */
function tier1Match(
  newTx: TransactionForDedup,
  existingTx: TransactionForDedup
): { isMatch: boolean; score: number } {
  // Extract merchant names from descriptions
  const newMerchant = extractMerchantName(newTx.description);
  const existingMerchant = extractMerchantName(existingTx.description);

  // Calculate similarity using combined methods (description vs description)
  let score = combinedSimilarity(newMerchant, existingMerchant);

  if (score >= TIER1_THRESHOLD) {
    return { isMatch: true, score };
  }

  // For Plaid sync: newTx has plaidMerchantName, compare against existing description
  // Example: newTx.plaidMerchantName = "Amazon Web Services", existingTx.description = "Amazon Web Services AWS.Amazon.com"
  if (newTx.plaidMerchantName) {
    const newPlaidMerchantClean = extractMerchantName(newTx.plaidMerchantName);
    const merchantNameScore = combinedSimilarity(newPlaidMerchantClean, existingMerchant);
    
    if (merchantNameScore >= TIER1_THRESHOLD) {
      return { isMatch: true, score: merchantNameScore };
    }
    
    score = Math.max(score, merchantNameScore);
  }

  // For CSV import: existingTx has plaidMerchantName, compare against new description
  // Example: existingTx.plaidMerchantName = "Chipotle Mexican Grill", newTx.description = "AplPay CHIPOTLE 1249"
  if (existingTx.plaidMerchantName) {
    const existingPlaidMerchantClean = extractMerchantName(existingTx.plaidMerchantName);
    const merchantNameScore = combinedSimilarity(newMerchant, existingPlaidMerchantClean);
    
    if (merchantNameScore >= TIER1_THRESHOLD) {
      return { isMatch: true, score: merchantNameScore };
    }
    
    score = Math.max(score, merchantNameScore);
  }

  // Also check token overlap as a secondary signal
  if (hasSignificantTokenOverlap(newTx.description, existingTx.description)) {
    const rawScore = jaroWinkler(newMerchant, existingMerchant);
    if (rawScore >= 0.75) {
      return { isMatch: true, score: Math.max(score, rawScore) };
    }
  }

  // Token overlap with plaid merchant names
  if (newTx.plaidMerchantName && hasSignificantTokenOverlap(newTx.plaidMerchantName, existingTx.description)) {
    const newPlaidMerchantClean = extractMerchantName(newTx.plaidMerchantName);
    const rawScore = jaroWinkler(newPlaidMerchantClean, existingMerchant);
    if (rawScore >= 0.75) {
      return { isMatch: true, score: Math.max(score, rawScore) };
    }
  }

  if (existingTx.plaidMerchantName && hasSignificantTokenOverlap(newTx.description, existingTx.plaidMerchantName)) {
    const existingPlaidMerchantClean = extractMerchantName(existingTx.plaidMerchantName);
    const rawScore = jaroWinkler(newMerchant, existingPlaidMerchantClean);
    if (rawScore >= 0.75) {
      return { isMatch: true, score: Math.max(score, rawScore) };
    }
  }

  return { isMatch: false, score };
}

/**
 * Find duplicate for a single transaction.
 * Runs through all tiers until a match is found or all tiers are exhausted.
 *
 * @param newTx The new transaction to check
 * @param candidates Pre-filtered candidates (same date + amount)
 * @param skipEmbeddings If true, skip tier 2 and 3 (for testing)
 */
export async function findDuplicate(
  newTx: TransactionForDedup,
  candidates: TransactionForDedup[],
  skipEmbeddings: boolean = false
): Promise<DedupeResult> {
  if (candidates.length === 0) {
    return { isUnique: true, confidence: 1.0, matchTier: "none" };
  }

  // Tier 1: Deterministic matching
  for (const candidate of candidates) {
    const result = tier1Match(newTx, candidate);
    if (result.isMatch) {
      return {
        isUnique: false,
        matchedTransaction: candidate,
        confidence: result.score,
        matchTier: "deterministic",
      };
    }
  }

  // If embeddings are disabled or API key not available, stop here
  if (skipEmbeddings || !isLLMAvailable()) {
    return { isUnique: true, confidence: 0.7, matchTier: "none" };
  }

  // Tier 2: Embedding similarity
  try {
    const newEmbedding = await getEmbedding(newTx.description);

    // Track all candidates with their embedding scores
    const candidatesWithScores: Array<{
      candidate: TransactionForDedup;
      score: number;
    }> = [];

    for (const candidate of candidates) {
      const candidateEmbedding = await getEmbedding(candidate.description);
      const similarity = cosineSimilarity(newEmbedding, candidateEmbedding);

      if (similarity >= TIER2_THRESHOLD) {
        return {
          isUnique: false,
          matchedTransaction: candidate,
          confidence: similarity,
          matchTier: "embedding",
        };
      }

      // Track ALL candidates for potential LLM verification
      // Having a date+amount match is strong evidence, so we should ask the LLM
      // even if embedding similarity is low (handles acronyms like AWS vs Amazon Web Services)
      candidatesWithScores.push({ candidate, score: similarity });
    }

    // Tier 3: LLM verification
    // Send candidates to LLM - prioritize higher embedding scores but include all
    // because embeddings fail on acronyms (e.g., "AWS" vs "Amazon Web Services" = 0.39)
    if (candidatesWithScores.length > 0) {
      // Sort by embedding score descending and take top candidates
      const sortedCandidates = candidatesWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Limit to top 5 to control LLM costs

      const pairs = sortedCandidates.map((p) => ({
        newDescription: newTx.description,
        existingDescription: p.candidate.description,
        amount: newTx.amount,
        date: newTx.date,
      }));

      const verificationResults = await verifyMatchesBatch(pairs);

      for (let i = 0; i < verificationResults.length; i++) {
        const result = verificationResults[i];
        if (result.isSameMerchant && result.confidence !== "low") {
          return {
            isUnique: false,
            matchedTransaction: sortedCandidates[i].candidate,
            confidence:
              result.confidence === "high"
                ? 0.95
                : result.confidence === "medium"
                  ? 0.85
                  : 0.75,
            matchTier: "llm",
          };
        }
      }
    }
  } catch (error) {
    console.error("Error in tier 2/3 matching:", error);
    // Fall back to tier 1 result (no match found)
  }

  return { isUnique: true, confidence: 0.6, matchTier: "none" };
}

/**
 * Find duplicates for a batch of transactions against existing transactions.
 * Optimized for performance with batched embedding calls.
 *
 * @param newTransactions Transactions to check for duplicates
 * @param existingTransactions Existing transactions in the database
 * @param options Configuration options
 */
export async function findDuplicatesBatch(
  newTransactions: TransactionForDedup[],
  existingTransactions: TransactionForDedup[],
  options: {
    skipEmbeddings?: boolean;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<BatchDedupeResult> {
  const startTime = Date.now();
  const { skipEmbeddings = false, onProgress } = options;

  const unique: TransactionForDedup[] = [];
  const duplicates: BatchDedupeResult["duplicates"] = [];
  let tier1Matches = 0;
  let tier2Matches = 0;
  let tier3Matches = 0;

  // Group existing transactions by date+amount for faster lookup
  // For Plaid transactions, index by BOTH authorized_date and posted_date
  // This allows CSV transactions to match against either date
  const existingByDateAmount = new Map<string, TransactionForDedup[]>();
  
  function addToIndex(date: string | null | undefined, tx: TransactionForDedup) {
    if (!date) return;
    const key = `${date}|${Math.abs(tx.amount).toFixed(2)}`;
    if (!existingByDateAmount.has(key)) {
      existingByDateAmount.set(key, []);
    }
    // Avoid adding duplicates
    const existing = existingByDateAmount.get(key)!;
    if (!existing.includes(tx)) {
      existing.push(tx);
    }
  }
  
  for (const tx of existingTransactions) {
    // Index by primary date
    addToIndex(tx.date, tx);
    
    // For Plaid transactions, also index by both specific dates
    // This ensures CSV can match against either authorized or posted date
    if (tx.plaidAuthorizedDate) {
      addToIndex(tx.plaidAuthorizedDate, tx);
    }
    if (tx.plaidPostedDate && tx.plaidPostedDate !== tx.date) {
      addToIndex(tx.plaidPostedDate, tx);
    }
  }

  /**
   * Get a date offset by N days (positive = future, negative = past)
   */
  function getOffsetDate(dateStr: string, offsetDays: number): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  /**
   * Get candidates that match the CSV transaction's date against any Plaid date
   * Uses a ±2 day window to handle bank-specific date offsets
   * - Amex: CSV matches Plaid authorized_date (0 offset)
   * - Chase: CSV is 1-2 days before Plaid posted_date (authorized_date often null)
   */
  function getCandidates(tx: TransactionForDedup): TransactionForDedup[] {
    const amount = Math.abs(tx.amount).toFixed(2);
    const candidates: TransactionForDedup[] = [];
    const seen = new Set<TransactionForDedup>();

    // Check exact date and ±2 day window
    for (let offset = -2; offset <= 2; offset++) {
      const checkDate = offset === 0 ? tx.date : getOffsetDate(tx.date, offset);
      const key = `${checkDate}|${amount}`;
      const matches = existingByDateAmount.get(key) || [];
      for (const match of matches) {
        if (!seen.has(match)) {
          seen.add(match);
          candidates.push(match);
        }
      }
    }

    return candidates;
  }

  // Pre-fetch embeddings for all new transactions if using tier 2/3
  if (!skipEmbeddings && isLLMAvailable()) {
    try {
      // Get all descriptions that might need embeddings
      const descriptionsToEmbed: string[] = [];

      for (const tx of newTransactions) {
        const candidates = getCandidates(tx);

        // Check if tier 1 would match
        let tier1Matched = false;
        for (const candidate of candidates) {
          const result = tier1Match(tx, candidate);
          if (result.isMatch) {
            tier1Matched = true;
            break;
          }
        }

        // Only need embeddings if tier 1 didn't match and there are candidates
        if (!tier1Matched && candidates.length > 0) {
          descriptionsToEmbed.push(tx.description);
          for (const candidate of candidates) {
            descriptionsToEmbed.push(candidate.description);
          }
        }
      }

      // Batch fetch all embeddings upfront
      if (descriptionsToEmbed.length > 0) {
        await getEmbeddingsBatch([...new Set(descriptionsToEmbed)]);
      }
    } catch (error) {
      console.error("Error pre-fetching embeddings:", error);
    }
  }

  // Process each new transaction
  for (let i = 0; i < newTransactions.length; i++) {
    const tx = newTransactions[i];

    // Get potential matches (same amount within ±1 day date window)
    const candidates = getCandidates(tx);

    // Find duplicate using all tiers
    const result = await findDuplicate(tx, candidates, skipEmbeddings);

    if (result.isUnique) {
      unique.push(tx);
    } else {
      duplicates.push({
        transaction: tx,
        matchedWith: result.matchedTransaction!,
        confidence: result.confidence,
        matchTier: result.matchTier as "deterministic" | "embedding" | "llm",
      });

      // Track tier stats
      switch (result.matchTier) {
        case "deterministic":
          tier1Matches++;
          break;
        case "embedding":
          tier2Matches++;
          break;
        case "llm":
          tier3Matches++;
          break;
      }
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, newTransactions.length);
    }
  }

  // Clear embedding cache after batch processing
  clearEmbeddingCache();

  return {
    unique,
    duplicates,
    stats: {
      total: newTransactions.length,
      unique: unique.length,
      duplicates: duplicates.length,
      tier1Matches,
      tier2Matches,
      tier3Matches,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * Quick deterministic-only deduplication (no API calls).
 * Use this for fast preview or when API is unavailable.
 */
export function findDuplicatesDeterministic(
  newTransactions: TransactionForDedup[],
  existingTransactions: TransactionForDedup[]
): BatchDedupeResult {
  const startTime = Date.now();

  const unique: TransactionForDedup[] = [];
  const duplicates: BatchDedupeResult["duplicates"] = [];

  // Group existing transactions by date+amount
  // For Plaid transactions, index by BOTH authorized_date and posted_date
  const existingByDateAmount = new Map<string, TransactionForDedup[]>();
  
  function addToIndex(date: string | null | undefined, tx: TransactionForDedup) {
    if (!date) return;
    const key = `${date}|${Math.abs(tx.amount).toFixed(2)}`;
    if (!existingByDateAmount.has(key)) {
      existingByDateAmount.set(key, []);
    }
    const existing = existingByDateAmount.get(key)!;
    if (!existing.includes(tx)) {
      existing.push(tx);
    }
  }
  
  for (const tx of existingTransactions) {
    addToIndex(tx.date, tx);
    if (tx.plaidAuthorizedDate) {
      addToIndex(tx.plaidAuthorizedDate, tx);
    }
    if (tx.plaidPostedDate && tx.plaidPostedDate !== tx.date) {
      addToIndex(tx.plaidPostedDate, tx);
    }
  }

  /**
   * Get a date offset by N days (positive = future, negative = past)
   */
  function getOffsetDate(dateStr: string, offsetDays: number): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  /**
   * Get candidates using ±2 day window
   */
  function getCandidates(tx: TransactionForDedup): TransactionForDedup[] {
    const amount = Math.abs(tx.amount).toFixed(2);
    const candidates: TransactionForDedup[] = [];
    const seen = new Set<TransactionForDedup>();

    for (let offset = -2; offset <= 2; offset++) {
      const checkDate = offset === 0 ? tx.date : getOffsetDate(tx.date, offset);
      const key = `${checkDate}|${amount}`;
      const matches = existingByDateAmount.get(key) || [];
      for (const match of matches) {
        if (!seen.has(match)) {
          seen.add(match);
          candidates.push(match);
        }
      }
    }

    return candidates;
  }

  // Process each new transaction
  for (const tx of newTransactions) {
    const candidates = getCandidates(tx);

    let matched = false;
    for (const candidate of candidates) {
      const result = tier1Match(tx, candidate);
      if (result.isMatch) {
        duplicates.push({
          transaction: tx,
          matchedWith: candidate,
          confidence: result.score,
          matchTier: "deterministic",
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      unique.push(tx);
    }
  }

  return {
    unique,
    duplicates,
    stats: {
      total: newTransactions.length,
      unique: unique.length,
      duplicates: duplicates.length,
      tier1Matches: duplicates.length,
      tier2Matches: 0,
      tier3Matches: 0,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

