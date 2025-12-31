/**
 * Shared types for transaction deduplication
 * Used by both web and mobile apps
 */

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
 * Result of Tier 1 matching for a single pair
 */
export interface Tier1MatchResult {
  isMatch: boolean;
  score: number;
}

/**
 * A duplicate match found during deduplication
 */
export interface DuplicateMatch {
  transaction: TransactionForDedup;
  matchedWith: TransactionForDedup;
  confidence: number;
  matchTier: "deterministic" | "llm";
}

/**
 * An uncertain pair that needs LLM verification
 */
export interface UncertainPair {
  newTransaction: TransactionForDedup;
  candidate: TransactionForDedup;
  tier1Score: number;
}

/**
 * Complete result from Tier 1 (deterministic) analysis
 */
export interface Tier1Result {
  /** High confidence matches - no LLM needed */
  definiteMatches: DuplicateMatch[];
  /** Uncertain pairs that need LLM verification */
  uncertainPairs: UncertainPair[];
  /** Transactions with no candidates found */
  unique: TransactionForDedup[];
  stats: {
    total: number;
    tier1Matches: number;
    uncertainCount: number;
    uniqueCount: number;
    processingTimeMs: number;
  };
}

/**
 * Result of batch deduplication (for backward compatibility with web)
 */
export interface BatchDedupeResult {
  unique: TransactionForDedup[];
  duplicates: DuplicateMatch[];
  stats: {
    total: number;
    unique: number;
    duplicates: number;
    tier1Matches: number;
    tier2Matches: number;
    processingTimeMs: number;
  };
}
