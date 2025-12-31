/**
 * Plaid Sync Date Range Optimization Tests
 *
 * Verifies that only transactions within ±5 days of incoming Plaid
 * transactions are sent to the dedup endpoint, not the entire database.
 */

import { describe, it, expect } from "vitest";

/**
 * Helper that replicates the date range calculation logic from use-plaid-sync.ts
 * This allows us to test the logic without hook dependencies.
 */
function calculateDateRange(plaidDates: string[]): { minDateStr: string; maxDateStr: string } {
  const minDate = new Date(Math.min(...plaidDates.map((d) => new Date(d).getTime())));
  const maxDate = new Date(Math.max(...plaidDates.map((d) => new Date(d).getTime())));
  minDate.setDate(minDate.getDate() - 5);
  maxDate.setDate(maxDate.getDate() + 5);
  const minDateStr = minDate.toISOString().split("T")[0];
  const maxDateStr = maxDate.toISOString().split("T")[0];
  return { minDateStr, maxDateStr };
}

/**
 * Simulates the filtering that would happen with the SQL BETWEEN clause
 */
function filterTransactionsByDateRange(
  transactions: { id: string; date: string }[],
  minDate: string,
  maxDate: string
): { id: string; date: string }[] {
  return transactions.filter((tx) => tx.date >= minDate && tx.date <= maxDate);
}

describe("Plaid Sync Date Range Optimization", () => {
  describe("calculateDateRange", () => {
    it("should calculate ±5 day range from single Plaid transaction", () => {
      const plaidDates = ["2024-12-27"];
      const { minDateStr, maxDateStr } = calculateDateRange(plaidDates);

      expect(minDateStr).toBe("2024-12-22"); // Dec 27 - 5 days
      expect(maxDateStr).toBe("2025-01-01"); // Dec 27 + 5 days
    });

    it("should calculate ±5 day range from multiple Plaid transactions", () => {
      const plaidDates = ["2024-12-27", "2024-12-28", "2024-12-29"];
      const { minDateStr, maxDateStr } = calculateDateRange(plaidDates);

      expect(minDateStr).toBe("2024-12-22"); // Dec 27 - 5 days
      expect(maxDateStr).toBe("2025-01-03"); // Dec 29 + 5 days
    });

    it("should handle transactions spanning multiple weeks", () => {
      const plaidDates = ["2024-12-15", "2024-12-29"];
      const { minDateStr, maxDateStr } = calculateDateRange(plaidDates);

      expect(minDateStr).toBe("2024-12-10"); // Dec 15 - 5 days
      expect(maxDateStr).toBe("2025-01-03"); // Dec 29 + 5 days
    });
  });

  describe("filterTransactionsByDateRange", () => {
    const allTransactions = [
      // Old transactions (should NOT be included)
      { id: "old-1", date: "2023-01-15" },
      { id: "old-2", date: "2023-06-20" },
      { id: "old-3", date: "2024-01-15" },
      { id: "old-4", date: "2024-11-01" },
      // Recent transactions within range (SHOULD be included)
      { id: "recent-1", date: "2024-12-22" }, // exactly at min boundary
      { id: "recent-2", date: "2024-12-25" },
      { id: "recent-3", date: "2024-12-27" },
      { id: "recent-4", date: "2024-12-29" },
      { id: "recent-5", date: "2025-01-01" },
      { id: "recent-6", date: "2025-01-03" }, // exactly at max boundary
      // Future transactions (should NOT be included)
      { id: "future-1", date: "2025-01-05" },
      { id: "future-2", date: "2025-06-15" },
    ];

    it("should only include transactions within the date range", () => {
      // Plaid transactions from Dec 27-29, 2024
      const plaidDates = ["2024-12-27", "2024-12-28", "2024-12-29"];
      const { minDateStr, maxDateStr } = calculateDateRange(plaidDates);

      const filtered = filterTransactionsByDateRange(allTransactions, minDateStr, maxDateStr);

      // Should include 6 recent transactions, exclude 4 old and 2 future
      expect(filtered.length).toBe(6);
      expect(filtered.map((t) => t.id)).toEqual([
        "recent-1",
        "recent-2",
        "recent-3",
        "recent-4",
        "recent-5",
        "recent-6",
      ]);
    });

    it("should NOT include transactions outside the ±5 day window", () => {
      const plaidDates = ["2024-12-27"];
      const { minDateStr, maxDateStr } = calculateDateRange(plaidDates);

      const filtered = filterTransactionsByDateRange(allTransactions, minDateStr, maxDateStr);
      const filteredIds = filtered.map((t) => t.id);

      // Verify old transactions are excluded
      expect(filteredIds).not.toContain("old-1");
      expect(filteredIds).not.toContain("old-2");
      expect(filteredIds).not.toContain("old-3");
      expect(filteredIds).not.toContain("old-4");

      // Verify future transactions are excluded
      expect(filteredIds).not.toContain("future-1");
      expect(filteredIds).not.toContain("future-2");
    });

    it("should return empty array when no transactions in range", () => {
      // All transactions are from 2023-2024, but Plaid returns 2025-06 transactions
      const plaidDates = ["2025-06-15", "2025-06-16"];
      const { minDateStr, maxDateStr } = calculateDateRange(plaidDates);

      const oldTransactions = [
        { id: "old-1", date: "2023-01-15" },
        { id: "old-2", date: "2024-01-15" },
        { id: "old-3", date: "2024-12-01" },
      ];

      const filtered = filterTransactionsByDateRange(oldTransactions, minDateStr, maxDateStr);

      expect(filtered.length).toBe(0);
    });
  });

  describe("Full scenario: 10k transactions, 3 new Plaid syncs", () => {
    it("should dramatically reduce the number of transactions sent to dedup", () => {
      // Simulate 10k transactions spanning 2 years
      const manyTransactions: { id: string; date: string }[] = [];

      // Generate transactions from Jan 2023 to Dec 2024 (2 years)
      for (let i = 0; i < 10000; i++) {
        const year = 2023 + Math.floor(i / 5000);
        const month = (i % 12) + 1;
        const day = (i % 28) + 1;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        manyTransactions.push({ id: `tx-${i}`, date: dateStr });
      }

      // New Plaid transactions from late December 2024
      const plaidDates = ["2024-12-27", "2024-12-28", "2024-12-29"];
      const { minDateStr, maxDateStr } = calculateDateRange(plaidDates);

      const filtered = filterTransactionsByDateRange(manyTransactions, minDateStr, maxDateStr);

      // Verify we're sending FAR fewer transactions to dedup
      expect(filtered.length).toBeLessThan(200); // Should be a small number
      expect(filtered.length).toBeLessThan(manyTransactions.length / 50); // Less than 2%

      // Log for visibility
      console.log(
        `Date range optimization: ${filtered.length} of ${manyTransactions.length} transactions ` +
          `(${((filtered.length / manyTransactions.length) * 100).toFixed(2)}%)`
      );
    });
  });
});
