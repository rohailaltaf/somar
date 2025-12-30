import { describe, it, expect } from "vitest";
import { runTier1Dedup, type TransactionForDedup } from "../index";

describe("Tier 1 Deterministic Matching", () => {
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

    const result = runTier1Dedup([csvTx], [plaidTx]);

    expect(result.definiteMatches.length).toBe(1);
    expect(result.unique.length).toBe(0);
    expect(result.uncertainPairs.length).toBe(0);
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

    const result = runTier1Dedup([csvTx], [plaidTx]);

    expect(result.definiteMatches.length).toBe(1);
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

    const result = runTier1Dedup([csvTx], [plaidTx]);

    expect(result.definiteMatches.length).toBe(0);
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

    const result = runTier1Dedup([csvTx], [plaidTx]);

    expect(result.definiteMatches.length).toBe(0);
  });

  it("should handle same merchant, same day, different amounts", () => {
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

    const result = runTier1Dedup(incoming, existing);

    // Should NOT match - different amounts means different transactions
    expect(result.definiteMatches.length).toBe(0);
    expect(result.unique.length).toBe(1);
  });

  it("should handle rideshare variations", () => {
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

    const result = runTier1Dedup(incoming, existing);

    expect(result.definiteMatches.length).toBe(1);
  });

  it("should return uncertainPairs when description similarity is low", () => {
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
        description: "AWS", // Very abbreviated - deterministic won't match
        amount: -45.67,
        date: "2025-01-15",
      },
    ];

    const result = runTier1Dedup(incoming, existing);

    // Should have candidate but not definite match
    expect(result.definiteMatches.length).toBe(0);
    expect(result.uncertainPairs.length).toBe(1);
    expect(result.unique.length).toBe(0);
  });
});
