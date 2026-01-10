/**
 * Plaid Sync Tests
 *
 * - Date Range Optimization: Verifies that only transactions within ±5 days
 *   of incoming Plaid transactions are sent to the dedup endpoint.
 * - Removal Logic: Verifies that only transactions that exist in the local DB
 *   are counted as removed (pending transactions are never added, so their
 *   removal notifications should be ignored).
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

/**
 * Simulates the local DB for testing removal logic.
 * Maps plaid_transaction_id to transaction data.
 */
type MockLocalDB = Map<string, { id: string; plaid_transaction_id: string }>;

/**
 * Replicates the removal logic from use-plaid-sync.ts
 * Only counts removals for transactions that exist in the local DB.
 */
function processRemovals(
  localDb: MockLocalDB,
  removedTxIds: string[]
): { removed: number; actuallyDeleted: string[] } {
  let removed = 0;
  const actuallyDeleted: string[] = [];

  for (const txId of removedTxIds) {
    const existing = localDb.get(txId);
    if (existing) {
      localDb.delete(txId);
      actuallyDeleted.push(txId);
      removed++;
    }
  }

  return { removed, actuallyDeleted };
}

describe("Plaid Sync Removal Logic", () => {
  describe("processRemovals", () => {
    it("should only count removals for transactions that exist in local DB", () => {
      const localDb: MockLocalDB = new Map([
        ["plaid-tx-1", { id: "local-1", plaid_transaction_id: "plaid-tx-1" }],
        ["plaid-tx-2", { id: "local-2", plaid_transaction_id: "plaid-tx-2" }],
      ]);

      // Plaid sends 3 removal notifications, but only 1 exists in our DB
      const removedTxIds = ["plaid-tx-1", "pending-tx-never-added", "another-pending"];

      const result = processRemovals(localDb, removedTxIds);

      expect(result.removed).toBe(1);
      expect(result.actuallyDeleted).toEqual(["plaid-tx-1"]);
      expect(localDb.size).toBe(1); // plaid-tx-2 still exists
    });

    it("should return 0 removed when none of the transactions exist", () => {
      const localDb: MockLocalDB = new Map([
        ["plaid-tx-1", { id: "local-1", plaid_transaction_id: "plaid-tx-1" }],
      ]);

      // All removal notifications are for pending transactions we never added
      const removedTxIds = [
        "pending-tx-1",
        "pending-tx-2",
        "pending-tx-3",
      ];

      const result = processRemovals(localDb, removedTxIds);

      expect(result.removed).toBe(0);
      expect(result.actuallyDeleted).toEqual([]);
      expect(localDb.size).toBe(1); // Nothing deleted
    });

    it("should delete all transactions when all exist in local DB", () => {
      const localDb: MockLocalDB = new Map([
        ["plaid-tx-1", { id: "local-1", plaid_transaction_id: "plaid-tx-1" }],
        ["plaid-tx-2", { id: "local-2", plaid_transaction_id: "plaid-tx-2" }],
        ["plaid-tx-3", { id: "local-3", plaid_transaction_id: "plaid-tx-3" }],
      ]);

      const removedTxIds = ["plaid-tx-1", "plaid-tx-2", "plaid-tx-3"];

      const result = processRemovals(localDb, removedTxIds);

      expect(result.removed).toBe(3);
      expect(result.actuallyDeleted).toEqual(["plaid-tx-1", "plaid-tx-2", "plaid-tx-3"]);
      expect(localDb.size).toBe(0);
    });

    it("should handle empty removal list", () => {
      const localDb: MockLocalDB = new Map([
        ["plaid-tx-1", { id: "local-1", plaid_transaction_id: "plaid-tx-1" }],
      ]);

      const result = processRemovals(localDb, []);

      expect(result.removed).toBe(0);
      expect(result.actuallyDeleted).toEqual([]);
      expect(localDb.size).toBe(1);
    });
  });

  describe("Pending transaction scenario", () => {
    it("should not count pending→posted transitions as removals", () => {
      // Scenario: User syncs daily. Pending transactions are filtered out during add.
      // When they post, Plaid sends pending version in "removed" + posted version in "added".
      // Since we never added the pending version, removal should be a no-op.

      const localDb: MockLocalDB = new Map([
        // Only posted transactions exist in local DB
        ["posted-tx-1", { id: "local-1", plaid_transaction_id: "posted-tx-1" }],
        ["posted-tx-2", { id: "local-2", plaid_transaction_id: "posted-tx-2" }],
      ]);

      // Plaid sends removal for 5 pending transactions that just posted
      // None of these were ever in our local DB
      const pendingRemovals = [
        "pending-amazon-123",
        "pending-starbucks-456",
        "pending-uber-789",
        "pending-netflix-012",
        "pending-spotify-345",
      ];

      const result = processRemovals(localDb, pendingRemovals);

      // Should report 0 removed since none existed
      expect(result.removed).toBe(0);
      expect(result.actuallyDeleted).toEqual([]);

      // Local DB unchanged
      expect(localDb.size).toBe(2);
    });

    it("should correctly handle mix of pending removals and actual removals", () => {
      // Scenario: Plaid sends removals for:
      // - 3 pending transactions (never in DB)
      // - 1 actual reversal/dispute (exists in DB)

      const localDb: MockLocalDB = new Map([
        ["posted-tx-1", { id: "local-1", plaid_transaction_id: "posted-tx-1" }],
        ["disputed-tx", { id: "local-2", plaid_transaction_id: "disputed-tx" }],
        ["posted-tx-2", { id: "local-3", plaid_transaction_id: "posted-tx-2" }],
      ]);

      const removedTxIds = [
        "pending-tx-1", // Never added (pending filtered out)
        "pending-tx-2", // Never added
        "disputed-tx",  // Exists - actual reversal
        "pending-tx-3", // Never added
      ];

      const result = processRemovals(localDb, removedTxIds);

      // Should only count the 1 actual removal
      expect(result.removed).toBe(1);
      expect(result.actuallyDeleted).toEqual(["disputed-tx"]);
      expect(localDb.size).toBe(2);
      expect(localDb.has("posted-tx-1")).toBe(true);
      expect(localDb.has("posted-tx-2")).toBe(true);
      expect(localDb.has("disputed-tx")).toBe(false);
    });
  });

  describe("Historical transaction preservation", () => {
    it("should not delete transactions older than the sync window (731 days when requesting 730)", () => {
      // Scenario: Plaid sync requests 730 days of data.
      // A transaction from day 731 should NOT be deleted, even if Plaid doesn't
      // return it in the sync response. Transactions are only deleted if Plaid
      // explicitly includes them in the "removed" array.

      const today = new Date("2026-01-10");
      const day730 = new Date(today);
      day730.setDate(day730.getDate() - 730);
      const day731 = new Date(today);
      day731.setDate(day731.getDate() - 731);

      const localDb: MockLocalDB = new Map([
        // Recent transactions (within 730 days)
        ["tx-recent-1", { id: "local-1", plaid_transaction_id: "tx-recent-1" }],
        ["tx-recent-2", { id: "local-2", plaid_transaction_id: "tx-recent-2" }],
        // Transaction exactly at 730 days
        ["tx-day-730", { id: "local-3", plaid_transaction_id: "tx-day-730" }],
        // Transaction at 731 days (outside sync window)
        ["tx-day-731", { id: "local-4", plaid_transaction_id: "tx-day-731" }],
        // Even older transactions
        ["tx-old-1", { id: "local-5", plaid_transaction_id: "tx-old-1" }],
        ["tx-old-2", { id: "local-6", plaid_transaction_id: "tx-old-2" }],
      ]);

      // Plaid only sends removal notifications for transactions it knows about
      // (within the 730 day window). It will NOT send removals for day 731+ transactions.
      // Simulate Plaid removing one recent transaction (e.g., a reversal)
      const removedTxIds = ["tx-recent-1"];

      const result = processRemovals(localDb, removedTxIds);

      // Only the explicitly removed transaction should be deleted
      expect(result.removed).toBe(1);
      expect(result.actuallyDeleted).toEqual(["tx-recent-1"]);

      // All historical transactions (731+ days) must be preserved
      expect(localDb.has("tx-day-731")).toBe(true);
      expect(localDb.has("tx-old-1")).toBe(true);
      expect(localDb.has("tx-old-2")).toBe(true);

      // Day 730 transaction also preserved (not in removed list)
      expect(localDb.has("tx-day-730")).toBe(true);

      // Total: 5 remaining (6 original - 1 deleted)
      expect(localDb.size).toBe(5);
    });

    it("should preserve all historical transactions when Plaid sends empty removal list", () => {
      // Scenario: Normal daily sync with no reversals/disputes.
      // All existing transactions should be preserved.

      const localDb: MockLocalDB = new Map([
        // Mix of old and new transactions
        ["tx-2024-01", { id: "local-1", plaid_transaction_id: "tx-2024-01" }],
        ["tx-2023-06", { id: "local-2", plaid_transaction_id: "tx-2023-06" }],
        ["tx-2022-12", { id: "local-3", plaid_transaction_id: "tx-2022-12" }],
        ["tx-2021-01", { id: "local-4", plaid_transaction_id: "tx-2021-01" }],
      ]);

      const initialSize = localDb.size;

      // No removals from Plaid
      const result = processRemovals(localDb, []);

      expect(result.removed).toBe(0);
      expect(localDb.size).toBe(initialSize);

      // Every transaction preserved
      expect(localDb.has("tx-2024-01")).toBe(true);
      expect(localDb.has("tx-2023-06")).toBe(true);
      expect(localDb.has("tx-2022-12")).toBe(true);
      expect(localDb.has("tx-2021-01")).toBe(true);
    });
  });
});
