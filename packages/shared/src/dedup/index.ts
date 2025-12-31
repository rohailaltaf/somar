/**
 * Transaction Deduplication - Shared Module
 *
 * This module provides client-side (Tier 1) deduplication that can run
 * in both web and mobile apps. LLM verification (Tier 2) requires a
 * server API call.
 *
 * Usage:
 * 1. Run runTier1Dedup() locally with new + existing transactions
 * 2. If uncertainPairs.length > 0, call /api/dedup/verify with batched pairs
 * 3. Combine definiteMatches + LLM results for final dedup
 */

// Types
export type {
  TransactionForDedup,
  Tier1MatchResult,
  DuplicateMatch,
  UncertainPair,
  Tier1Result,
  BatchDedupeResult,
} from "./types";

// Tier 1 matching
export {
  TIER1_THRESHOLD,
  tier1Match,
  findCandidates,
  buildDateAmountIndex,
  runTier1Dedup,
} from "./tier1";

// Batch utilities
export { LLM_API_BATCH_LIMIT, chunkArray } from "./batch-utils";

// Utility functions (for advanced use cases)
export {
  extractMerchantName,
  hasSignificantTokenOverlap,
} from "./merchant-extractor";

export { jaroWinkler, combinedSimilarity } from "./jaro-winkler";
