"use server";

/**
 * Server-side deduplication using LLM.
 * 
 * In E2EE mode, the client sends both:
 * - New transactions (from CSV)
 * - Existing transactions (from their local encrypted DB)
 * 
 * Server runs LLM deduplication and returns results.
 * The actual data merge happens client-side.
 */

import {
  findDuplicatesBatch,
  findDuplicatesDeterministic,
  TransactionForDedup,
  BatchDedupeResult,
} from "@/lib/dedup";

export interface TransactionForDedupInput {
  id?: string; // Only existing transactions have IDs
  description: string;
  amount: number;
  date: string;
  plaidAuthorizedDate?: string | null;
  plaidPostedDate?: string | null;
  plaidMerchantName?: string | null;
}

export interface DedupAnalysisResult {
  unique: TransactionForDedupInput[];
  duplicates: Array<{
    transaction: TransactionForDedupInput;
    matchedWith: {
      id: string;
      description: string;
      amount: number;
      date: string;
    };
    confidence: number;
    matchTier: "deterministic" | "llm";
  }>;
  stats: BatchDedupeResult["stats"];
}

/**
 * Analyze transactions for duplicates using the 2-tier deduplication system.
 * 
 * Client sends both new and existing transactions.
 * Server runs dedup and returns results.
 *
 * Tier 1: Deterministic matching (fast, free)
 * Tier 2: LLM verification (for uncertain cases)
 *
 * @param newTransactions Parsed transactions from CSV
 * @param existingTransactions Existing transactions from client's local DB
 * @param useAI Whether to use LLM for uncertain cases
 */
export async function analyzeForDuplicates(
  newTransactions: TransactionForDedupInput[],
  existingTransactions: TransactionForDedupInput[],
  useAI: boolean = true
): Promise<DedupAnalysisResult> {
  // Convert to dedup format
  const newTxs: TransactionForDedup[] = newTransactions.map((t) => ({
    description: t.description,
    amount: t.amount,
    date: t.date,
  }));

  const existingTxs: TransactionForDedup[] = existingTransactions.map((t) => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    date: t.date,
    plaidAuthorizedDate: t.plaidAuthorizedDate,
    plaidPostedDate: t.plaidPostedDate,
    plaidMerchantName: t.plaidMerchantName,
  }));

  // Run deduplication
  let result: BatchDedupeResult;

  if (useAI && process.env.OPENAI_API_KEY) {
    // Use 2-tier system: Deterministic + LLM
    result = await findDuplicatesBatch(newTxs, existingTxs);
  } else {
    // Fall back to deterministic-only
    result = findDuplicatesDeterministic(newTxs, existingTxs);
  }

  // Convert results back to client format
  return {
    unique: result.unique.map((t) => ({
      description: t.description,
      amount: t.amount,
      date: t.date,
    })),
    duplicates: result.duplicates.map((d) => ({
      transaction: {
        description: d.transaction.description,
        amount: d.transaction.amount,
        date: d.transaction.date,
      },
      matchedWith: {
        id: d.matchedWith.id || "",
        description: d.matchedWith.description,
        amount: d.matchedWith.amount,
        date: d.matchedWith.date,
      },
      confidence: d.confidence,
      matchTier: d.matchTier,
    })),
    stats: result.stats,
  };
}

/**
 * Check if AI-powered deduplication is available.
 */
export async function isAIDedupAvailable(): Promise<boolean> {
  return !!process.env.OPENAI_API_KEY;
}
