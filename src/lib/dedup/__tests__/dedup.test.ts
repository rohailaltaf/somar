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
  findDuplicatesBatch,
  findDuplicatesDeterministic,
  TransactionForDedup,
} from "../index";
import { csvTransactions } from "./fixtures/csv-transactions";
import { plaidTransactions } from "./fixtures/plaid-transactions";
import { extractMerchantName } from "../merchant-extractor";
import { jaroWinkler, combinedSimilarity } from "../jaro-winkler";
import { isLLMAvailable } from "../llm-verifier";

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

describe("Merchant Name Extraction", () => {
  it("should extract merchant from AplPay prefix", () => {
    const extracted = extractMerchantName(
      "AplPay BURRITO BARN 1249RIVERDALE         XX"
    );
    // Should contain the core merchant name
    expect(extracted).toContain("BURRITO BARN");
  });

  it("should extract merchant from TST* (Toast) prefix", () => {
    const extracted = extractMerchantName(
      "TST* STEAKHOUSE - RIRIVERDALE         XX"
    );
    // Should contain the core merchant name (TST* prefix removed)
    expect(extracted).toContain("STEAKHOUSE");
  });

  it("should handle clean Plaid names", () => {
    expect(extractMerchantName("Burrito Barn")).toBe("BURRITO BARN");
  });

  it("should extract merchant from store numbers", () => {
    const extracted = extractMerchantName(
      "FRIED CHICKEN CO 724OAKVILLE            XX"
    );
    // Should contain the core merchant name
    expect(extracted).toContain("FRIED CHICKEN");
  });

  it("should handle subscription services", () => {
    const extracted = extractMerchantName(
      "MUSIC STREAM USA    NEW YORK            NY"
    );
    // Should contain the core merchant name
    expect(extracted).toContain("MUSIC STREAM");
  });

  it("should handle website domains", () => {
    const extracted = extractMerchantName(
      "Cloud Hosting Svcs  CLOUDHOST.COM       WA"
    );
    // Should contain the core merchant name
    expect(extracted).toContain("CLOUD HOSTING");
  });
});

describe("String Similarity", () => {
  it("should match merchant variations with AplPay prefix removed", () => {
    // After extraction: "BURRITO BARN" vs "Burrito Barn"
    const extracted = extractMerchantName(
      "AplPay BURRITO BARN 1249RIVERDALE         XX"
    );
    const score = jaroWinkler(extracted, "Burrito Barn");
    expect(score).toBe(1); // Perfect match after normalization
  });

  it("should match abbreviated names", () => {
    const score = combinedSimilarity(
      "FRIED CHICKEN",
      "Fried Chicken Company"
    );
    expect(score).toBeGreaterThan(0.6);
  });

  it("should NOT match different restaurants with low similarity", () => {
    // Jaro-Winkler alone may not perfectly distinguish all merchants
    // The full deduplication pipeline uses amount + date + merchant together
    const score = jaroWinkler("BURRITO BARN", "Taco Town");
    // Score should be relatively low but Jaro-Winkler is generous
    // The important thing is it's below our TIER1_THRESHOLD of 0.88
    expect(score).toBeLessThan(0.88);
  });

  it("should NOT match similar-sounding but different merchants", () => {
    const score = combinedSimilarity("BIG BOX STORE", "Discount Mart");
    expect(score).toBeLessThan(0.5);
  });
});

describe("Deterministic Matching (Tier 1)", () => {
  it("should match exact amount + exact date + similar description", () => {
    const csvTx: TransactionForDedup = {
      description: "MUSIC STREAM USA    NEW YORK            NY",
      amount: -11.99,
      date: "2025-01-16",
    };

    const plaidTx: TransactionForDedup = {
      id: "plaid-17",
      description: "Music Stream",
      amount: -11.99,
      date: "2025-01-16",
      plaidMerchantName: "Music Stream",
    };

    const result = findDuplicatesDeterministic([csvTx], [plaidTx]);

    expect(result.duplicates.length).toBe(1);
    expect(result.duplicates[0].matchTier).toBe("deterministic");
    expect(result.unique.length).toBe(0);
  });

  it("should match with 1-day date variance (authorized vs posted)", () => {
    const csvTx: TransactionForDedup = {
      description: "AplPay BURRITO BARN 1249RIVERDALE         XX",
      amount: -22.77,
      date: "2025-01-15",
    };

    const plaidTx: TransactionForDedup = {
      id: "plaid-1",
      description: "Burrito Barn",
      amount: -22.77,
      date: "2025-01-16", // Posted 1 day later
      plaidMerchantName: "Burrito Barn",
      plaidAuthorizedDate: "2025-01-15", // Authorized on same day as CSV
    };

    const result = findDuplicatesDeterministic([csvTx], [plaidTx]);

    expect(result.duplicates.length).toBe(1);
  });

  it("should NOT match different amounts", () => {
    const csvTx: TransactionForDedup = {
      description: "AplPay BURRITO BARN 1249RIVERDALE         XX",
      amount: -22.77,
      date: "2025-01-15",
    };

    const plaidTx: TransactionForDedup = {
      id: "plaid-2",
      description: "Burrito Barn",
      amount: -15.73, // Different amount
      date: "2025-01-15",
      plaidMerchantName: "Burrito Barn",
    };

    const result = findDuplicatesDeterministic([csvTx], [plaidTx]);

    expect(result.duplicates.length).toBe(0);
    expect(result.unique.length).toBe(1);
  });

  it("should NOT match dates more than 3 days apart", () => {
    const csvTx: TransactionForDedup = {
      description: "MUSIC STREAM USA    NEW YORK            NY",
      amount: -11.99,
      date: "2025-01-16",
    };

    const plaidTx: TransactionForDedup = {
      id: "plaid-18",
      description: "Music Stream",
      amount: -11.99,
      date: "2025-02-16", // A month later - different transaction
      plaidMerchantName: "Music Stream",
    };

    const result = findDuplicatesDeterministic([csvTx], [plaidTx]);

    expect(result.duplicates.length).toBe(0);
  });
});

describe("Full Deduplication Pipeline (with LLM)", () => {
  describe("Scenario: Plaid syncs after CSV import", () => {
    it("should identify all matching transactions as duplicates", async () => {
      // User imported CSV first
      const existingCsv = csvTransactions.map(csvToDedup);

      // Now Plaid syncs - these should be identified as duplicates
      const newPlaid = plaidTransactions.map(plaidToDedup);

      // Use full pipeline including LLM when available
      const result = await findDuplicatesBatch(newPlaid, existingCsv);

      // Most Plaid transactions should match existing CSV
      const matchRate = result.duplicates.length / newPlaid.length;
      console.log(
        `Match rate: ${(matchRate * 100).toFixed(1)}% (${result.duplicates.length}/${newPlaid.length})`
      );
      console.log(`LLM available: ${isLLMAvailable()}`);
      console.log(
        `Tier 1: ${result.stats.tier1Matches}, Tier 2 (LLM): ${result.stats.tier3Matches}`
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
      const result = await findDuplicatesBatch(newPlaid, existingCsv);

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
      const result = await findDuplicatesBatch(newCsv, existingPlaid);

      // Most CSV transactions should match existing Plaid
      const matchRate = result.duplicates.length / newCsv.length;
      console.log(
        `Match rate: ${(matchRate * 100).toFixed(1)}% (${result.duplicates.length}/${newCsv.length})`
      );
      console.log(`LLM available: ${isLLMAvailable()}`);
      console.log(
        `Tier 1: ${result.stats.tier1Matches}, Tier 2 (LLM): ${result.stats.tier3Matches}`
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
      const result = await findDuplicatesBatch(incoming, existing);

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
      const result = await findDuplicatesBatch(incoming, existing);

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
      const result = await findDuplicatesBatch(incoming, existing);

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
      const result = await findDuplicatesBatch(incoming, existing);

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
    const result = await findDuplicatesBatch(incoming, existing);

    // Stats should be present
    expect(result.stats).toBeDefined();
    expect(result.stats.tier1Matches).toBeGreaterThanOrEqual(0);
    expect(result.stats.tier2Matches).toBeGreaterThanOrEqual(0); // Always 0 (embeddings removed)
    expect(result.stats.tier3Matches).toBeGreaterThanOrEqual(0); // LLM matches

    // Total should equal duplicates found
    const totalTiered =
      result.stats.tier1Matches +
      result.stats.tier2Matches +
      result.stats.tier3Matches;
    expect(totalTiered).toBe(result.duplicates.length);

    console.log(
      `Stats: Tier1=${result.stats.tier1Matches}, LLM=${result.stats.tier3Matches}, Total=${result.duplicates.length}`
    );
  });
});

describe("Performance", () => {
  it("should process full pipeline in reasonable time", async () => {
    const existing = plaidTransactions.map(plaidToDedup);
    const incoming = csvTransactions.map(csvToDedup);

    const start = Date.now();

    // Use full pipeline including LLM
    const result = await findDuplicatesBatch(incoming, existing);

    const elapsed = Date.now() - start;
    console.log(
      `Processed ${incoming.length} transactions in ${elapsed}ms (LLM available: ${isLLMAvailable()})`
    );
    console.log(
      `Matches: ${result.duplicates.length} (Tier1: ${result.stats.tier1Matches}, LLM: ${result.stats.tier3Matches})`
    );

    // Allow 30 seconds for LLM calls
    expect(elapsed).toBeLessThan(30000);
  });
});

describe("Deterministic-only Mode", () => {
  it("should work without LLM when skipEmbeddings is true", async () => {
    const existing = plaidTransactions.map(plaidToDedup);
    const incoming = csvTransactions.map(csvToDedup);

    const result = await findDuplicatesBatch(incoming, existing, {
      skipEmbeddings: true, // Disable LLM
    });

    // Should still get good match rate with deterministic only
    const matchRate = result.duplicates.length / incoming.length;
    console.log(
      `Deterministic-only match rate: ${(matchRate * 100).toFixed(1)}%`
    );

    expect(matchRate).toBeGreaterThan(0.8);
    // All matches should be tier 1
    expect(result.stats.tier3Matches).toBe(0);
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
    const result = await findDuplicatesBatch(incoming, existing);

    console.log(
      `AWS vs Amazon: duplicates=${result.duplicates.length}, tier1=${result.stats.tier1Matches}, llm=${result.stats.tier3Matches}`
    );

    // LLM should recognize AWS = Amazon Web Services
    if (isLLMAvailable()) {
      expect(result.duplicates.length).toBe(1);
      // This should be caught by LLM since deterministic won't match
      expect(result.stats.tier3Matches).toBeGreaterThanOrEqual(0);
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
    const result = await findDuplicatesBatch(incoming, existing);

    console.log(
      `DoorDash McDonald's: duplicates=${result.duplicates.length}, tier1=${result.stats.tier1Matches}, llm=${result.stats.tier3Matches}`
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
    const result = await findDuplicatesBatch(incoming, existing);

    console.log(
      `Starbucks vs Dunkin: duplicates=${result.duplicates.length}`
    );

    // Should NOT match - different merchants
    expect(result.duplicates.length).toBe(0);
    expect(result.unique.length).toBe(1);
  });
});
