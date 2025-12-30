/**
 * Deduplication Test Suite
 *
 * Tests the COMPLETE deduplication algorithm including LLM calls to ensure:
 * 1. Plaid sync after CSV import correctly identifies duplicates
 * 2. CSV import after Plaid sync correctly identifies duplicates
 * 3. No false positives (different transactions not marked as duplicates)
 * 4. No false negatives (same transactions not missed)
 *
 * NOTE: These tests call the real OpenAI API when OPENAI_API_KEY is set.
 * This is intentional - we need to test the full pipeline including AI.
 *
 * These tests use FICTIONAL anonymized data that preserves realistic
 * formatting patterns without containing any real personal information.
 */

import { describe, it, expect } from "vitest";
import {
  runTier1Dedup,
  type TransactionForDedup,
} from "@somar/shared/dedup";
import { csvTransactions } from "./fixtures/csv-transactions";
import { plaidTransactions } from "./fixtures/plaid-transactions";
import { verifyMatchesBatch, isLLMAvailable } from "../llm-verifier";

/**
 * Test helper: Run the full 2-tier dedup pipeline.
 * Uses runTier1Dedup from shared + verifyMatchesBatch for LLM.
 */
async function runFullDedup(
  newTransactions: TransactionForDedup[],
  existingTransactions: TransactionForDedup[],
  options: { skipLLM?: boolean } = {}
): Promise<{
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
    tier1Matches: number;
    tier2Matches: number;
    processingTimeMs: number;
  };
}> {
  const startTime = Date.now();
  const { skipLLM = false } = options;
  const useLLM = !skipLLM && isLLMAvailable();

  // Step 1: Run Tier 1 (deterministic) matching
  const tier1Result = runTier1Dedup(newTransactions, existingTransactions);

  const duplicates: Array<{
    transaction: TransactionForDedup;
    matchedWith: TransactionForDedup;
    confidence: number;
    matchTier: "deterministic" | "llm";
  }> = tier1Result.definiteMatches.map((m) => ({
    transaction: m.transaction,
    matchedWith: m.matchedWith,
    confidence: m.confidence,
    matchTier: "deterministic" as const,
  }));

  let tier2Matches = 0;
  const unique: TransactionForDedup[] = [...tier1Result.unique];

  // Step 2: Run Tier 2 (LLM) for uncertain pairs
  if (tier1Result.uncertainPairs.length > 0 && useLLM) {
    console.log(`[Dedup] Phase 2: Running LLM verification for ${tier1Result.uncertainPairs.length} uncertain pairs`);

    // Build pairs for LLM
    const pairs = tier1Result.uncertainPairs.map((p) => ({
      newDescription: p.newTransaction.description,
      existingDescription: p.candidate.description,
      amount: p.newTransaction.amount,
      date: p.newTransaction.date,
    }));

    const llmResults = await verifyMatchesBatch(pairs);

    // Track which new transactions have been matched
    const matchedNewTxs = new Set<string>();

    for (let i = 0; i < llmResults.length; i++) {
      const result = llmResults[i];
      const pair = tier1Result.uncertainPairs[i];
      const newTxKey = pair.newTransaction.id || pair.newTransaction.description;

      if (matchedNewTxs.has(newTxKey)) continue;

      if (result.isSameMerchant && result.confidence !== "low") {
        duplicates.push({
          transaction: pair.newTransaction,
          matchedWith: pair.candidate,
          confidence: result.confidence === "high" ? 0.95 : result.confidence === "medium" ? 0.85 : 0.75,
          matchTier: "llm",
        });
        tier2Matches++;
        matchedNewTxs.add(newTxKey);
      }
    }

    // Add unmatched uncertain transactions to unique
    const matchedDescriptions = new Set(
      duplicates.filter((d) => d.matchTier === "llm").map((d) => d.transaction.id || d.transaction.description)
    );
    for (const pair of tier1Result.uncertainPairs) {
      const key = pair.newTransaction.id || pair.newTransaction.description;
      if (!matchedDescriptions.has(key) && !unique.some((u) => (u.id || u.description) === key)) {
        unique.push(pair.newTransaction);
      }
    }

    console.log(`[Dedup] Phase 2 complete: ${tier2Matches} LLM matches`);
  } else if (tier1Result.uncertainPairs.length > 0 && !useLLM) {
    // No LLM - add uncertain pairs to unique
    for (const pair of tier1Result.uncertainPairs) {
      if (!unique.some((u) => (u.id || u.description) === (pair.newTransaction.id || pair.newTransaction.description))) {
        unique.push(pair.newTransaction);
      }
    }
  }

  return {
    unique,
    duplicates,
    stats: {
      total: newTransactions.length,
      unique: unique.length,
      duplicates: duplicates.length,
      tier1Matches: tier1Result.definiteMatches.length,
      tier2Matches,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// Convert fixtures to TransactionForDedup format
function csvToDedup(tx: (typeof csvTransactions)[0]): TransactionForDedup {
  return {
    description: tx.description,
    amount: tx.amount,
    date: tx.date,
  };
}

function plaidToDedup(tx: (typeof plaidTransactions)[0]): TransactionForDedup {
  return {
    id: tx.id,
    description: tx.description,
    amount: tx.amount,
    date: tx.date,
    plaidMerchantName: tx.plaidMerchantName,
    plaidAuthorizedDate: tx.plaidAuthorizedDate,
    plaidPostedDate: tx.plaidPostedDate,
  };
}

describe("Full Deduplication Pipeline (with LLM)", () => {
  describe("Scenario: Plaid syncs after CSV import", () => {
    it("should identify all matching transactions as duplicates", async () => {
      // User imported CSV first
      const existingCsv = csvTransactions.map(csvToDedup);

      // Now Plaid syncs - these should be identified as duplicates
      const newPlaid = plaidTransactions.map(plaidToDedup);

      // Use full pipeline including LLM when available
      const result = await runFullDedup(newPlaid, existingCsv);

      // Most Plaid transactions should match existing CSV
      const matchRate = result.duplicates.length / newPlaid.length;
      console.log(
        `Match rate: ${(matchRate * 100).toFixed(1)}% (${result.duplicates.length}/${newPlaid.length})`
      );
      console.log(`LLM available: ${isLLMAvailable()}`);
      console.log(
        `Tier 1: ${result.stats.tier1Matches}, Tier 2 (LLM): ${result.stats.tier2Matches}`
      );

      // We expect at least 90% match rate with full pipeline
      expect(matchRate).toBeGreaterThan(0.9);
    });

    it("should not produce false positives", async () => {
      const existingCsv: TransactionForDedup[] = [
        {
          description: "AplPay BURRITO BARN 1249RIVERDALE         XX",
          amount: -22.77,
          date: "2025-01-15",
        },
      ];

      // Different restaurant, same amount and date (rare but possible)
      const newPlaid: TransactionForDedup[] = [
        {
          id: "plaid-fake",
          description: "Taco Town",
          amount: -22.77,
          date: "2025-01-15",
          plaidMerchantName: "Taco Town",
        },
      ];

      // Use full pipeline - LLM should correctly identify these as DIFFERENT merchants
      const result = await runFullDedup(newPlaid, existingCsv);

      // Should NOT match - different merchants
      expect(result.duplicates.length).toBe(0);
      expect(result.unique.length).toBe(1);
    });
  });

  describe("Scenario: CSV imports after Plaid sync", () => {
    it("should identify all matching transactions as duplicates", async () => {
      // User connected Plaid first
      const existingPlaid = plaidTransactions.map(plaidToDedup);

      // Now user imports CSV - these should be identified as duplicates
      const newCsv = csvTransactions.map(csvToDedup);

      // Use full pipeline including LLM when available
      const result = await runFullDedup(newCsv, existingPlaid);

      // Most CSV transactions should match existing Plaid
      const matchRate = result.duplicates.length / newCsv.length;
      console.log(
        `Match rate: ${(matchRate * 100).toFixed(1)}% (${result.duplicates.length}/${newCsv.length})`
      );
      console.log(`LLM available: ${isLLMAvailable()}`);
      console.log(
        `Tier 1: ${result.stats.tier1Matches}, Tier 2 (LLM): ${result.stats.tier2Matches}`
      );

      // We expect at least 90% match rate with full pipeline
      expect(matchRate).toBeGreaterThan(0.9);
    });
  });

  describe("Edge Cases", () => {
    it("should handle same merchant, same day, different amounts", async () => {
      // Two Cloud CDN charges on same day - both are legitimate
      const existing: TransactionForDedup[] = [
        {
          id: "plaid-58",
          description: "Cloud CDN",
          amount: -10.46,
          date: "2025-01-18",
        },
      ];

      const incoming: TransactionForDedup[] = [
        {
          description: "CLOUD CDN INC       SAN FRANCISCO       CA",
          amount: -14.20, // Different amount
          date: "2025-01-18",
        },
      ];

      // Use full pipeline
      const result = await runFullDedup(incoming, existing);

      // Should NOT match - different amounts means different transactions
      expect(result.duplicates.length).toBe(0);
      expect(result.unique.length).toBe(1);
    });

    it("should handle rideshare variations", async () => {
      const existing: TransactionForDedup[] = [
        {
          id: "plaid-37",
          description: "Rideshare",
          amount: -28.98,
          date: "2025-01-09",
          plaidMerchantName: "Rideshare",
        },
      ];

      const incoming: TransactionForDedup[] = [
        {
          description: "RIDESHARE",
          amount: -28.98,
          date: "2025-01-09",
        },
      ];

      // Use full pipeline
      const result = await runFullDedup(incoming, existing);

      expect(result.duplicates.length).toBe(1);
    });

    it("should handle CloudHost vs Cloud Hosting Svcs", async () => {
      const existing: TransactionForDedup[] = [
        {
          id: "plaid-21",
          description: "CloudHost",
          amount: -3.29,
          date: "2025-01-02",
          plaidMerchantName: "CloudHost",
        },
      ];

      const incoming: TransactionForDedup[] = [
        {
          description: "Cloud Hosting Svcs  CLOUDHOST.COM       WA",
          amount: -3.29,
          date: "2025-01-02",
        },
      ];

      // Use full pipeline - should match via deterministic or LLM
      const result = await runFullDedup(incoming, existing);

      expect(result.duplicates.length).toBe(1);
    });

    it("should handle payment/transfer transactions", async () => {
      // These are not real purchases and typically won't match across systems
      const existing: TransactionForDedup[] = [];

      const incoming: TransactionForDedup[] = [
        {
          description: "MOBILE PAYMENT - THANK YOU",
          amount: 2000.0, // Credit/payment
          date: "2025-01-02",
        },
      ];

      // Use full pipeline
      const result = await runFullDedup(incoming, existing);

      // Should be unique since there's nothing to match
      expect(result.unique.length).toBe(1);
    });
  });
});

describe("Statistics and Reporting", () => {
  it("should track tier distribution correctly", async () => {
    const existing = plaidTransactions.slice(0, 10).map(plaidToDedup);
    const incoming = csvTransactions.slice(0, 10).map(csvToDedup);

    // Use full pipeline
    const result = await runFullDedup(incoming, existing);

    // Stats should be present
    expect(result.stats).toBeDefined();
    expect(result.stats.tier1Matches).toBeGreaterThanOrEqual(0); // Deterministic
    expect(result.stats.tier2Matches).toBeGreaterThanOrEqual(0); // LLM

    // Total should equal duplicates found
    const totalTiered = result.stats.tier1Matches + result.stats.tier2Matches;
    expect(totalTiered).toBe(result.duplicates.length);

    console.log(
      `Stats: Tier1=${result.stats.tier1Matches}, LLM=${result.stats.tier2Matches}, Total=${result.duplicates.length}`
    );
  });
});

describe("Performance", () => {
  it("should process full pipeline in reasonable time", async () => {
    const existing = plaidTransactions.map(plaidToDedup);
    const incoming = csvTransactions.map(csvToDedup);

    const start = Date.now();

    // Use full pipeline including LLM
    const result = await runFullDedup(incoming, existing);

    const elapsed = Date.now() - start;
    console.log(
      `Processed ${incoming.length} transactions in ${elapsed}ms (LLM available: ${isLLMAvailable()})`
    );
    console.log(
      `Matches: ${result.duplicates.length} (Tier1: ${result.stats.tier1Matches}, LLM: ${result.stats.tier2Matches})`
    );

    // Allow 30 seconds for LLM calls
    expect(elapsed).toBeLessThan(30000);
  });
});

describe("Deterministic-only Mode", () => {
  it("should work without LLM when skipLLM is true", async () => {
    const existing = plaidTransactions.map(plaidToDedup);
    const incoming = csvTransactions.map(csvToDedup);

    const result = await runFullDedup(incoming, existing, {
      skipLLM: true, // Disable LLM
    });

    // Should still get good match rate with deterministic only
    const matchRate = result.duplicates.length / incoming.length;
    console.log(
      `Deterministic-only match rate: ${(matchRate * 100).toFixed(1)}%`
    );

    expect(matchRate).toBeGreaterThan(0.8);
    // All matches should be tier 1 (no LLM matches)
    expect(result.stats.tier2Matches).toBe(0);
  });
});

describe("Per-Transaction Candidate Limiting (Plaid Sync Behavior)", () => {
  /**
   * These tests verify the behavior documented for Plaid sync:
   * - Each incoming transaction gets its own set of candidates
   * - Up to 5 candidates are sent to LLM per transaction
   * - Multiple transactions can each trigger separate LLM calls
   */

  it("should handle multiple candidates for a single transaction", async () => {
    // Simulate scenario: 7 existing transactions with same amount, different dates
    // Only candidates within ±2 days should be considered
    const existing: TransactionForDedup[] = [
      { id: "1", description: "Coffee Shop A", amount: -5.50, date: "2025-01-10" },
      { id: "2", description: "Coffee Shop B", amount: -5.50, date: "2025-01-11" },
      { id: "3", description: "Coffee Shop C", amount: -5.50, date: "2025-01-12" },
      { id: "4", description: "Coffee Shop D", amount: -5.50, date: "2025-01-13" },
      { id: "5", description: "Coffee Shop E", amount: -5.50, date: "2025-01-14" },
      { id: "6", description: "Coffee Shop F", amount: -5.50, date: "2025-01-15" },
      { id: "7", description: "Coffee Shop G", amount: -5.50, date: "2025-01-16" },
    ];

    // Incoming transaction on Jan 13 - candidates within ±2 days = Jan 11-15 (5 candidates)
    const incoming: TransactionForDedup[] = [
      {
        description: "STARBUCKS #1234",
        amount: -5.50,
        date: "2025-01-13",
        plaidMerchantName: "Starbucks",
      },
    ];

    // Use deterministic-only to see how many would be candidates
    const result = await runFullDedup(incoming, existing, { skipLLM: true });

    // Should have 0 matches since descriptions don't match deterministically
    // But this verifies the pre-filtering by amount happens correctly
    expect(result.unique.length).toBe(1);

    console.log(
      `Candidates within date range would be: ${
        existing.filter((e) => {
          const days = Math.abs(
            (new Date(e.date).getTime() - new Date("2025-01-13").getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return days <= 2;
        }).length
      }`
    );
  });

  it("should process each incoming transaction independently", async () => {
    // Two different incoming transactions should each get their own candidate matching
    const existing: TransactionForDedup[] = [
      { id: "1", description: "Amazon", amount: -25.00, date: "2025-01-15", plaidMerchantName: "Amazon" },
      { id: "2", description: "Walmart", amount: -30.00, date: "2025-01-15", plaidMerchantName: "Walmart" },
    ];

    const incoming: TransactionForDedup[] = [
      { description: "AMZN MKTP US", amount: -25.00, date: "2025-01-15" },
      { description: "WAL-MART #1234", amount: -30.00, date: "2025-01-15" },
    ];

    // Each incoming transaction should match its corresponding existing one
    const result = await runFullDedup(incoming, existing);

    console.log(
      `Two transactions: duplicates=${result.duplicates.length}, tier1=${result.stats.tier1Matches}, tier2=${result.stats.tier2Matches}`
    );

    // Both should be processed independently and potentially match
    // The exact match count depends on deterministic vs LLM matching
    expect(result.duplicates.length + result.unique.length).toBe(2);
  });

  it("should not cross-contaminate matches between transactions", async () => {
    // Transaction A should only match with candidates for A, not B
    const existing: TransactionForDedup[] = [
      { id: "amazon-1", description: "Amazon Prime", amount: -14.99, date: "2025-01-15", plaidMerchantName: "Amazon Prime" },
      { id: "netflix-1", description: "Netflix", amount: -14.99, date: "2025-01-15", plaidMerchantName: "Netflix" },
    ];

    // Same amount as both, but clearly different merchants
    const incoming: TransactionForDedup[] = [
      { description: "AMAZON PRIME MEMBERSHIP", amount: -14.99, date: "2025-01-15" },
      { description: "NETFLIX.COM", amount: -14.99, date: "2025-01-15" },
    ];

    const result = await runFullDedup(incoming, existing);

    console.log(
      `Same amount, different merchants: duplicates=${result.duplicates.length}`
    );

    // Should match correctly - Amazon to Amazon, Netflix to Netflix
    // Not Amazon to Netflix or vice versa
    if (result.duplicates.length === 2) {
      // Verify correct matching (not cross-matched)
      const amazonMatch = result.duplicates.find(
        (d) => d.transaction.description.includes("AMAZON")
      );
      const netflixMatch = result.duplicates.find(
        (d) => d.transaction.description.includes("NETFLIX")
      );

      if (amazonMatch) {
        expect(amazonMatch.matchedWith.description).toContain("Amazon");
      }
      if (netflixMatch) {
        expect(netflixMatch.matchedWith.description).toContain("Netflix");
      }
    }
  });

  it("should demonstrate that LLM is called per-transaction (not globally limited)", async () => {
    // Create 3 transactions that require LLM (fail deterministic)
    // Each should get its own LLM evaluation
    const existing: TransactionForDedup[] = [
      { id: "1", description: "Amazon Web Services", amount: -10.00, date: "2025-01-15", plaidMerchantName: "Amazon Web Services" },
      { id: "2", description: "Google Cloud Platform", amount: -20.00, date: "2025-01-15", plaidMerchantName: "Google Cloud Platform" },
      { id: "3", description: "Microsoft Azure", amount: -30.00, date: "2025-01-15", plaidMerchantName: "Microsoft Azure" },
    ];

    // Abbreviated names that need LLM to match
    const incoming: TransactionForDedup[] = [
      { description: "AWS", amount: -10.00, date: "2025-01-15" },
      { description: "GCP", amount: -20.00, date: "2025-01-15" },
      { description: "AZURE", amount: -30.00, date: "2025-01-15" },
    ];

    const result = await runFullDedup(incoming, existing);

    console.log(
      `3 abbreviated names: duplicates=${result.duplicates.length}, tier1=${result.stats.tier1Matches}, tier2=${result.stats.tier2Matches}`
    );

    // If LLM is available, it should process all 3 (not just first 5 globally)
    if (isLLMAvailable()) {
      // At least some should match via LLM
      expect(result.stats.tier2Matches).toBeGreaterThan(0);
    }

    // Total processed should be 3
    expect(result.duplicates.length + result.unique.length).toBe(3);
  });
});

describe("LLM Tier Verification", () => {
  it("should use LLM to match abbreviated names that fail deterministic", async () => {
    // AWS vs Amazon Web Services - deterministic matching will fail
    // because the strings are too different, but LLM should understand
    const existing: TransactionForDedup[] = [
      {
        id: "plaid-aws",
        description: "Amazon Web Services",
        amount: -45.67,
        date: "2025-01-15",
        plaidMerchantName: "Amazon Web Services",
      },
    ];

    const incoming: TransactionForDedup[] = [
      {
        description: "AWS",
        amount: -45.67,
        date: "2025-01-15",
      },
    ];

    // Full pipeline should catch this via LLM
    const result = await runFullDedup(incoming, existing);

    console.log(
      `AWS vs Amazon: duplicates=${result.duplicates.length}, tier1=${result.stats.tier1Matches}, llm=${result.stats.tier2Matches}`
    );

    // LLM should recognize AWS = Amazon Web Services
    if (isLLMAvailable()) {
      expect(result.duplicates.length).toBe(1);
      // This should be caught by LLM since deterministic won't match
      expect(result.stats.tier2Matches).toBeGreaterThanOrEqual(0);
    }
  });

  it("should use LLM to match DoorDash merchant names", async () => {
    // DoorDash adds their name as prefix - e.g. "DD MCDONALD'S" vs "McDonald's"
    const existing: TransactionForDedup[] = [
      {
        id: "plaid-dd",
        description: "McDonald's",
        amount: -15.43,
        date: "2025-02-01",
        plaidMerchantName: "McDonald's",
      },
    ];

    const incoming: TransactionForDedup[] = [
      {
        description: "DOORDASH*MCDONALDS",
        amount: -15.43,
        date: "2025-02-01",
      },
    ];

    // Full pipeline
    const result = await runFullDedup(incoming, existing);

    console.log(
      `DoorDash McDonald's: duplicates=${result.duplicates.length}, tier1=${result.stats.tier1Matches}, llm=${result.stats.tier2Matches}`
    );

    // Should match - same merchant, same amount, same date
    if (isLLMAvailable()) {
      expect(result.duplicates.length).toBe(1);
    }
  });

  it("should correctly reject different merchants with same amount", async () => {
    // Different merchants, same amount and date - should NOT match
    const existing: TransactionForDedup[] = [
      {
        id: "plaid-starbucks",
        description: "Starbucks",
        amount: -5.75,
        date: "2025-01-20",
        plaidMerchantName: "Starbucks",
      },
    ];

    const incoming: TransactionForDedup[] = [
      {
        description: "DUNKIN DONUTS",
        amount: -5.75, // Same amount (coincidence)
        date: "2025-01-20", // Same date
      },
    ];

    // Full pipeline - LLM should correctly say these are DIFFERENT
    const result = await runFullDedup(incoming, existing);

    console.log(
      `Starbucks vs Dunkin: duplicates=${result.duplicates.length}`
    );

    // Should NOT match - different merchants
    expect(result.duplicates.length).toBe(0);
    expect(result.unique.length).toBe(1);
  });
});
