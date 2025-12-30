/**
 * Tier 1 (Deterministic) Transaction Deduplication
 *
 * Fast, free, client-side matching using:
 * - Merchant name extraction
 * - Jaro-Winkler string similarity
 * - Token overlap analysis
 *
 * Threshold: 0.88 for deterministic match
 */

import type {
  TransactionForDedup,
  Tier1MatchResult,
  DuplicateMatch,
  UncertainPair,
  Tier1Result,
} from "./types";
import {
  extractMerchantName,
  hasSignificantTokenOverlap,
} from "./merchant-extractor";
import { jaroWinkler, combinedSimilarity } from "./jaro-winkler";

/** Threshold for deterministic matching */
export const TIER1_THRESHOLD = 0.88;

/** Maximum candidates to return per transaction in uncertainPairs */
const MAX_CANDIDATES_PER_TX = 5;

/**
 * Tier 1: Deterministic matching using merchant extraction and string similarity.
 * Fast and free - always runs first.
 */
export function tier1Match(
  newTx: TransactionForDedup,
  existingTx: TransactionForDedup
): Tier1MatchResult {
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
 * Get date string with offset
 */
function getOffsetDate(dateStr: string, offsetDays: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Find candidate transactions that could match (same amount, similar date)
 */
export function findCandidates(
  tx: TransactionForDedup,
  existingByDateAmount: Map<string, TransactionForDedup[]>,
  dateToleranceDays: number = 2
): TransactionForDedup[] {
  const amount = Math.abs(tx.amount).toFixed(2);
  const candidates: TransactionForDedup[] = [];
  const seen = new Set<TransactionForDedup>();

  for (let offset = -dateToleranceDays; offset <= dateToleranceDays; offset++) {
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

/**
 * Build an index of existing transactions by date+amount for fast lookup
 */
export function buildDateAmountIndex(
  existingTransactions: TransactionForDedup[]
): Map<string, TransactionForDedup[]> {
  const index = new Map<string, TransactionForDedup[]>();

  function addToIndex(
    date: string | null | undefined,
    tx: TransactionForDedup
  ) {
    if (!date) return;
    const key = `${date}|${Math.abs(tx.amount).toFixed(2)}`;
    if (!index.has(key)) {
      index.set(key, []);
    }
    const existing = index.get(key)!;
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

  return index;
}

/**
 * Run Tier 1 (deterministic) deduplication.
 *
 * Returns:
 * - definiteMatches: High confidence matches (no LLM needed)
 * - uncertainPairs: Need LLM verification (have candidates but no match)
 * - unique: No candidates found at all
 *
 * @param newTransactions Transactions to check for duplicates
 * @param existingTransactions Existing transactions in the database
 * @param options Configuration options
 */
export function runTier1Dedup(
  newTransactions: TransactionForDedup[],
  existingTransactions: TransactionForDedup[],
  options: {
    maxCandidatesPerTx?: number;
    dateToleranceDays?: number;
  } = {}
): Tier1Result {
  const startTime = Date.now();
  const {
    maxCandidatesPerTx = MAX_CANDIDATES_PER_TX,
    dateToleranceDays = 2,
  } = options;

  const definiteMatches: DuplicateMatch[] = [];
  const uncertainPairs: UncertainPair[] = [];
  const unique: TransactionForDedup[] = [];

  // Build index for fast lookup
  const existingByDateAmount = buildDateAmountIndex(existingTransactions);

  // Process each new transaction
  for (const tx of newTransactions) {
    const candidates = findCandidates(tx, existingByDateAmount, dateToleranceDays);

    if (candidates.length === 0) {
      // No candidates at all - definitely unique
      unique.push(tx);
      continue;
    }

    // Try Tier 1 matching
    let foundMatch = false;
    let bestScore = 0;
    let bestCandidate: TransactionForDedup | null = null;

    for (const candidate of candidates) {
      const result = tier1Match(tx, candidate);
      if (result.isMatch) {
        definiteMatches.push({
          transaction: tx,
          matchedWith: candidate,
          confidence: result.score,
          matchTier: "deterministic",
        });
        foundMatch = true;
        break;
      }
      // Track best score for uncertain pairs
      if (result.score > bestScore) {
        bestScore = result.score;
        bestCandidate = candidate;
      }
    }

    if (!foundMatch) {
      // Has candidates but no definite match - add to uncertain pairs
      // Include top candidates for LLM to verify
      const topCandidates = candidates.slice(0, maxCandidatesPerTx);
      for (const candidate of topCandidates) {
        const result = tier1Match(tx, candidate);
        uncertainPairs.push({
          newTransaction: tx,
          candidate,
          tier1Score: result.score,
        });
      }
    }
  }

  return {
    definiteMatches,
    uncertainPairs,
    unique,
    stats: {
      total: newTransactions.length,
      tier1Matches: definiteMatches.length,
      uncertainCount: uncertainPairs.length,
      uniqueCount: unique.length,
      processingTimeMs: Date.now() - startTime,
    },
  };
}
