"use server";

import { getTransactions } from "./transactions";
import {
  findDuplicatesBatch,
  findDuplicatesDeterministic,
  TransactionForDedup,
  BatchDedupeResult,
} from "@/lib/dedup";

export interface ParsedTransactionForDedup {
  description: string;
  amount: number;
  date: string;
}

export interface DedupAnalysisResult {
  unique: ParsedTransactionForDedup[];
  duplicates: Array<{
    transaction: ParsedTransactionForDedup;
    matchedWith: {
      id: string;
      description: string;
      amount: number;
      date: string;
    };
    confidence: number;
    matchTier: "deterministic" | "embedding" | "llm";
  }>;
  stats: BatchDedupeResult["stats"];
}

/**
 * Analyze transactions for duplicates using the 2-tier deduplication system.
 * This is a server action that can be called from the client.
 *
 * Tier 1: Deterministic matching (fast, free)
 * Tier 2: LLM verification (for uncertain cases)
 *
 * @param transactions Parsed transactions from CSV
 * @param accountId Account to check against
 * @param useAI Whether to use LLM for uncertain cases
 */
export async function analyzeForDuplicates(
  transactions: ParsedTransactionForDedup[],
  accountId: string,
  useAI: boolean = true
): Promise<DedupAnalysisResult> {
  // Get existing transactions for this account
  const existingTransactions = await getTransactions({ accountId });

  // Convert to dedup format
  const newTxs: TransactionForDedup[] = transactions.map((t) => ({
    description: t.description,
    amount: t.amount,
    date: t.date,
  }));

  const existingTxs: TransactionForDedup[] = existingTransactions.map((t) => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    date: t.date,
    // Include Plaid dates for accurate matching against CSV
    plaidAuthorizedDate: t.plaidAuthorizedDate,
    plaidPostedDate: t.plaidPostedDate,
    // Include Plaid merchant name for better matching
    plaidMerchantName: t.plaidMerchantName,
  }));

  // Run deduplication
  let result: BatchDedupeResult;

  if (useAI && process.env.OPENAI_API_KEY) {
    // Use 2-tier system: Deterministic + LLM
    result = await findDuplicatesBatch(newTxs, existingTxs, {
      skipEmbeddings: false, // Enables LLM tier
    });
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
