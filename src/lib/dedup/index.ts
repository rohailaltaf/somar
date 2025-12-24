/**
 * Transaction Deduplication Engine
 *
 * A 2-tier matching system:
 *
 * Tier 1: Deterministic (instant, free)
 *   - Merchant name extraction + Jaro-Winkler similarity
 *   - Token overlap analysis
 *   - Threshold: 0.88
 *
 * Tier 2: LLM Verification (accurate, low cost)
 *   - GPT-4o-mini for uncertain cases where deterministic matching fails
 *   - Batch processing for efficiency
 *   - Only called when Tier 1 doesn't find a match but candidates exist
 */

import {
  extractMerchantName,
  hasSignificantTokenOverlap,
} from "./merchant-extractor";
import { jaroWinkler, combinedSimilarity } from "./jaro-winkler";
import { verifyMatchesBatch, isLLMAvailable } from "./llm-verifier";

// Re-export utilities
export { extractMerchantName } from "./merchant-extractor";
export { jaroWinkler, combinedSimilarity } from "./jaro-winkler";

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
  matchTier: "deterministic" | "llm" | "none";
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
    matchTier: "deterministic" | "llm";
  }>;
  stats: {
    total: number;
    unique: number;
    duplicates: number;
    tier1Matches: number; // Deterministic matches
    tier2Matches: number; // LLM matches
    processingTimeMs: number;
  };
}

// Threshold for deterministic matching
const TIER1_THRESHOLD = 0.88; // Jaro-Winkler threshold

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
    const merchantNameScore = combinedSimilarity(
      newPlaidMerchantClean,
      existingMerchant
    );

    if (merchantNameScore >= TIER1_THRESHOLD) {
      return { isMatch: true, score: merchantNameScore };
    }

    score = Math.max(score, merchantNameScore);
  }

  // For CSV import: existingTx has plaidMerchantName, compare against new description
  // Example: existingTx.plaidMerchantName = "Chipotle Mexican Grill", newTx.description = "AplPay CHIPOTLE 1249"
  if (existingTx.plaidMerchantName) {
    const existingPlaidMerchantClean = extractMerchantName(
      existingTx.plaidMerchantName
    );
    const merchantNameScore = combinedSimilarity(
      newMerchant,
      existingPlaidMerchantClean
    );

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
  if (
    newTx.plaidMerchantName &&
    hasSignificantTokenOverlap(newTx.plaidMerchantName, existingTx.description)
  ) {
    const newPlaidMerchantClean = extractMerchantName(newTx.plaidMerchantName);
    const rawScore = jaroWinkler(newPlaidMerchantClean, existingMerchant);
    if (rawScore >= 0.75) {
      return { isMatch: true, score: Math.max(score, rawScore) };
    }
  }

  if (
    existingTx.plaidMerchantName &&
    hasSignificantTokenOverlap(newTx.description, existingTx.plaidMerchantName)
  ) {
    const existingPlaidMerchantClean = extractMerchantName(
      existingTx.plaidMerchantName
    );
    const rawScore = jaroWinkler(newMerchant, existingPlaidMerchantClean);
    if (rawScore >= 0.75) {
      return { isMatch: true, score: Math.max(score, rawScore) };
    }
  }

  return { isMatch: false, score };
}

/**
 * Find duplicate for a single transaction.
 * Runs through tiers until a match is found or all tiers are exhausted.
 *
 * @param newTx The new transaction to check
 * @param candidates Pre-filtered candidates (same date + amount)
 * @param useLLM If true, use LLM for uncertain cases
 */
export async function findDuplicate(
  newTx: TransactionForDedup,
  candidates: TransactionForDedup[],
  useLLM: boolean = true
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

  // If LLM is disabled or API key not available, stop here
  if (!useLLM || !isLLMAvailable()) {
    return { isUnique: true, confidence: 0.7, matchTier: "none" };
  }

  // Tier 2: LLM verification for remaining candidates
  // Since we have date+amount matches, these are strong candidates worth asking the LLM about
  try {
    // Limit to top 5 candidates to control LLM costs
    const candidatesToCheck = candidates.slice(0, 5);

    const pairs = candidatesToCheck.map((candidate) => ({
      newDescription: newTx.description,
      existingDescription: candidate.description,
      amount: newTx.amount,
      date: newTx.date,
    }));

    const verificationResults = await verifyMatchesBatch(pairs);

    for (let i = 0; i < verificationResults.length; i++) {
      const result = verificationResults[i];
      if (result.isSameMerchant && result.confidence !== "low") {
        return {
          isUnique: false,
          matchedTransaction: candidatesToCheck[i],
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
  } catch (error) {
    console.error("Error in LLM matching:", error);
    // Fall back to no match
  }

  return { isUnique: true, confidence: 0.6, matchTier: "none" };
}

/**
 * Find duplicates for a batch of transactions against existing transactions.
 *
 * @param newTransactions Transactions to check for duplicates
 * @param existingTransactions Existing transactions in the database
 * @param options Configuration options
 */
export async function findDuplicatesBatch(
  newTransactions: TransactionForDedup[],
  existingTransactions: TransactionForDedup[],
  options: {
    skipLLM?: boolean; // If true, only use deterministic matching (no API calls)
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<BatchDedupeResult> {
  const startTime = Date.now();
  const { skipLLM = false, onProgress } = options;
  const useLLM = !skipLLM;

  const unique: TransactionForDedup[] = [];
  const duplicates: BatchDedupeResult["duplicates"] = [];
  let tier1Matches = 0; // Deterministic
  let tier2Matches = 0; // LLM

  // Group existing transactions by date+amount for faster lookup
  // For Plaid transactions, index by BOTH authorized_date and posted_date
  const existingByDateAmount = new Map<string, TransactionForDedup[]>();

  function addToIndex(
    date: string | null | undefined,
    tx: TransactionForDedup
  ) {
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
   */
  function getCandidates(tx: TransactionForDedup): TransactionForDedup[] {
    const amount = Math.abs(tx.amount).toFixed(2);
    const candidates: TransactionForDedup[] = [];
    const seen = new Set<TransactionForDedup>();

    // Check exact date and ±2 day window
    for (let offset = -2; offset <= 2; offset++) {
      const checkDate =
        offset === 0 ? tx.date : getOffsetDate(tx.date, offset);
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
  for (let i = 0; i < newTransactions.length; i++) {
    const tx = newTransactions[i];

    // Get potential matches (same amount within ±2 day date window)
    const candidates = getCandidates(tx);

    // Find duplicate using all tiers
    const result = await findDuplicate(tx, candidates, useLLM);

    if (result.isUnique) {
      unique.push(tx);
    } else {
      duplicates.push({
        transaction: tx,
        matchedWith: result.matchedTransaction!,
        confidence: result.confidence,
        matchTier: result.matchTier as "deterministic" | "llm",
      });

      // Track tier stats
      switch (result.matchTier) {
        case "deterministic":
          tier1Matches++;
          break;
        case "llm":
          tier2Matches++;
          break;
      }
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, newTransactions.length);
    }
  }

  return {
    unique,
    duplicates,
    stats: {
      total: newTransactions.length,
      unique: unique.length,
      duplicates: duplicates.length,
      tier1Matches,
      tier2Matches,
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
  const existingByDateAmount = new Map<string, TransactionForDedup[]>();

  function addToIndex(
    date: string | null | undefined,
    tx: TransactionForDedup
  ) {
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

  function getOffsetDate(dateStr: string, offsetDays: number): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getCandidates(tx: TransactionForDedup): TransactionForDedup[] {
    const amount = Math.abs(tx.amount).toFixed(2);
    const candidates: TransactionForDedup[] = [];
    const seen = new Set<TransactionForDedup>();

    for (let offset = -2; offset <= 2; offset++) {
      const checkDate =
        offset === 0 ? tx.date : getOffsetDate(tx.date, offset);
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
      processingTimeMs: Date.now() - startTime,
    },
  };
}
