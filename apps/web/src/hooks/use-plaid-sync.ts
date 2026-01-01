"use client";

import { useState, useCallback } from "react";
import { useDatabaseAdapter } from "@somar/shared/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { Transaction as PlaidTransaction } from "plaid";
import {
  runTier1Dedup,
  chunkArray,
  LLM_API_BATCH_LIMIT,
  type TransactionForDedup,
  type DuplicateMatch,
  type UncertainPair,
} from "@somar/shared/dedup";

/**
 * Plaid Sync Hook
 *
 * Client-side sync logic for Plaid transactions.
 * Uses server proxy pattern - client owns the cursor for data integrity.
 * Uses unified dedup system via /api/dedup/batch for duplicate detection.
 */

interface SyncResult {
  plaidItemId: string;
  added: number;
  modified: number;
  removed: number;
  upgraded: number; // CSV transactions upgraded with Plaid data
  errors: string[];
  requiresReauth: boolean;
}

interface SyncStatus {
  stage: "fetching" | "processing" | "deduplicating" | "saving";
  progress?: number;
  total?: number;
}

interface PlaidSyncResponse {
  success: boolean;
  data?: {
    added: PlaidTransaction[];
    modified: PlaidTransaction[];
    removed: Array<{ transaction_id: string }>;
    nextCursor: string;
  };
  error?: {
    code: string;
    message: string;
    requiresReauth?: boolean;
  };
}

interface LLMVerifyResponse {
  success: boolean;
  data?: {
    matches: Array<{
      newTransactionId?: string;
      newTransactionDescription: string;
      candidateId: string;
      confidence: number;
    }>;
    nonMatches: string[];
    stats: {
      totalPairs: number;
      matchesFound: number;
      processingTimeMs: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

interface CategorizationRule {
  pattern: string;
  category_id: string;
}

interface LocalAccount {
  id: string;
  plaid_account_id: string | null;
}

interface ExistingTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  plaid_transaction_id: string | null;
  plaid_authorized_date: string | null;
  plaid_posted_date: string | null;
  plaid_merchant_name: string | null;
}

// Track which items are currently syncing (module-level to persist across hook instances)
const syncingItemsSet = new Set<string>();

export function usePlaidSync() {
  const { adapter, isReady, save } = useDatabaseAdapter();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  /**
   * Sync a single Plaid item.
   */
  const syncItem = useCallback(
    async (plaidItemId: string): Promise<SyncResult> => {
      if (!adapter || !isReady) {
        return {
          plaidItemId,
          added: 0,
          modified: 0,
          removed: 0,
          upgraded: 0,
          errors: ["Database not ready"],
          requiresReauth: false,
        };
      }

      // Prevent concurrent syncs on the same item
      if (syncingItemsSet.has(plaidItemId)) {
        return {
          plaidItemId,
          added: 0,
          modified: 0,
          removed: 0,
          upgraded: 0,
          errors: [],
          requiresReauth: false,
        };
      }

      syncingItemsSet.add(plaidItemId);
      setIsSyncing(true);
      setSyncStatus({ stage: "fetching" });

      const result: SyncResult = {
        plaidItemId,
        added: 0,
        modified: 0,
        removed: 0,
        upgraded: 0,
        errors: [],
        requiresReauth: false,
      };

      try {
        // 1. Get current cursor from local DB
        const syncState = adapter.get<{ cursor: string; last_synced_at: string }>(
          "SELECT cursor, last_synced_at FROM plaid_sync_state WHERE item_id = ?",
          [plaidItemId]
        );
        const cursor = syncState?.cursor;

        // 2. Call /api/plaid/sync with cursor
        const response = await fetch("/api/plaid/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plaidItemId, cursor }),
        });

        const data: PlaidSyncResponse = await response.json();

        if (!data.success || !data.data) {
          result.errors.push(data.error?.message || "Sync failed");
          result.requiresReauth = data.error?.requiresReauth || false;
          return result;
        }

        setSyncStatus({ stage: "processing" });

        // Get all local accounts with plaid_account_id
        const localAccounts = adapter.all<LocalAccount>(
          "SELECT id, plaid_account_id FROM accounts WHERE plaid_account_id IS NOT NULL"
        );
        const accountMap = new Map(
          localAccounts.map((a) => [a.plaid_account_id, a.id])
        );

        // Get categorization rules for auto-categorization
        const rules = adapter.all<CategorizationRule>(
          "SELECT pattern, category_id FROM categorization_rules"
        );

        const { added, modified, removed, nextCursor } = data.data;

        // 3. Process added transactions with deduplication
        // Filter to non-pending transactions with valid accounts
        const plaidTxsToProcess = added.filter((plaidTx) => {
          if (plaidTx.pending) {
            return false;
          }
          if (!accountMap.has(plaidTx.account_id)) {
            return false;
          }
          // Skip if already synced
          const existing = adapter.get<{ id: string }>(
            "SELECT id FROM transactions WHERE plaid_transaction_id = ?",
            [plaidTx.transaction_id]
          );
          if (existing) {
            return false;
          }
          return true;
        });

        if (plaidTxsToProcess.length > 0) {
          setSyncStatus({ stage: "deduplicating" });

          // Calculate date range from incoming Plaid transactions (±5 days buffer)
          const plaidDates = plaidTxsToProcess.map((tx) => tx.date);
          const minDate = new Date(
            Math.min(...plaidDates.map((d) => new Date(d).getTime()))
          );
          const maxDate = new Date(
            Math.max(...plaidDates.map((d) => new Date(d).getTime()))
          );
          minDate.setDate(minDate.getDate() - 5);
          maxDate.setDate(maxDate.getDate() + 5);
          const minDateStr = minDate.toISOString().split("T")[0];
          const maxDateStr = maxDate.toISOString().split("T")[0];

          // Get existing CSV transactions within date range (no plaid_transaction_id)
          const existingCsvTxs = adapter.all<ExistingTransaction>(
            `SELECT id, description, amount, date,
              plaid_transaction_id, plaid_authorized_date,
              plaid_posted_date, plaid_merchant_name
             FROM transactions
             WHERE plaid_transaction_id IS NULL
               AND date BETWEEN ? AND ?`,
            [minDateStr, maxDateStr]
          );

          // Convert to dedup format
          const plaidForDedup: TransactionForDedup[] = plaidTxsToProcess.map(
            (plaidTx) => ({
              id: plaidTx.transaction_id, // Use Plaid ID as identifier
              description: plaidTx.name || plaidTx.merchant_name || "",
              amount: -plaidTx.amount, // Flip sign
              date: plaidTx.authorized_date ?? plaidTx.date, // Prefer authorized_date
              plaidAuthorizedDate: plaidTx.authorized_date,
              plaidPostedDate: plaidTx.date,
              plaidMerchantName: plaidTx.merchant_name,
            })
          );

          const existingForDedup: TransactionForDedup[] = existingCsvTxs.map(
            (tx) => ({
              id: tx.id,
              description: tx.description,
              amount: tx.amount,
              date: tx.date,
              plaidAuthorizedDate: tx.plaid_authorized_date,
              plaidPostedDate: tx.plaid_posted_date,
              plaidMerchantName: tx.plaid_merchant_name,
            })
          );

          // Step 1: Run Tier 1 (deterministic) matching locally
          const tier1Result = runTier1Dedup(plaidForDedup, existingForDedup);

          // Step 2: If uncertain pairs exist, call API for LLM verification (with batching)
          const allDuplicates: DuplicateMatch[] = [...tier1Result.definiteMatches];

          if (tier1Result.uncertainPairs.length > 0) {
            // Batch API calls to respect the 100 pair limit
            const batches = chunkArray(tier1Result.uncertainPairs, LLM_API_BATCH_LIMIT);
            const processedNewTxs = new Set<string>();

            for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
              const batch = batches[batchIdx];
              setSyncStatus({
                stage: "deduplicating",
                progress: batchIdx * LLM_API_BATCH_LIMIT,
                total: tier1Result.uncertainPairs.length,
              });

              try {
                const response = await fetch("/api/dedup/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uncertainPairs: batch }),
                });

                const llmResult: LLMVerifyResponse = await response.json();

                if (llmResult.success && llmResult.data) {
                  // Add LLM-confirmed matches to duplicates
                  for (const match of llmResult.data.matches) {
                    const pair = batch.find(
                      (p: UncertainPair) =>
                        (p.newTransaction.id === match.newTransactionId ||
                          p.newTransaction.description === match.newTransactionDescription) &&
                        p.candidate.id === match.candidateId
                    );
                    if (pair && !processedNewTxs.has(pair.newTransaction.id || pair.newTransaction.description)) {
                      allDuplicates.push({
                        transaction: pair.newTransaction,
                        matchedWith: pair.candidate,
                        confidence: match.confidence,
                        matchTier: "llm",
                      });
                      processedNewTxs.add(pair.newTransaction.id || pair.newTransaction.description);
                    }
                  }
                }
              } catch (error) {
                console.error("[Plaid Sync] LLM verification batch failed:", error);
                // Continue with remaining batches
              }
            }
          }

          setSyncStatus({ stage: "processing" });

          // Build duplicate map: plaidTxId -> existingTxId
          const duplicateMap = new Map<string, string>();
          for (const dup of allDuplicates) {
            const plaidTxId = dup.transaction.id;
            const existingTxId = dup.matchedWith.id;
            if (plaidTxId && existingTxId) {
              duplicateMap.set(plaidTxId, existingTxId);
            }
          }

          // Process each Plaid transaction
          for (const plaidTx of plaidTxsToProcess) {
            const localAccountId = accountMap.get(plaidTx.account_id)!;
            const matchedExistingId = duplicateMap.get(plaidTx.transaction_id);

            if (matchedExistingId) {
              // Found a duplicate - upgrade existing transaction with Plaid data
              adapter.run(
                `UPDATE transactions SET
                  plaid_transaction_id = ?,
                  plaid_merchant_name = ?,
                  plaid_authorized_date = ?,
                  plaid_posted_date = ?,
                  plaid_name = ?,
                  plaid_original_description = ?
                WHERE id = ?`,
                [
                  plaidTx.transaction_id,
                  plaidTx.merchant_name ?? null,
                  plaidTx.authorized_date ?? null,
                  plaidTx.date,
                  plaidTx.name,
                  plaidTx.name,
                  matchedExistingId,
                ]
              );
              result.upgraded++;
            } else {
              // No duplicate - insert new transaction
              const categoryId = findCategory(plaidTx, rules);
              const txId = crypto.randomUUID();

              adapter.run(
                `INSERT INTO transactions (
                  id, account_id, category_id, description, amount, date,
                  excluded, is_confirmed, created_at,
                  plaid_transaction_id, plaid_original_description,
                  plaid_name, plaid_merchant_name,
                  plaid_authorized_date, plaid_posted_date
                ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  txId,
                  localAccountId,
                  categoryId,
                  plaidTx.name || plaidTx.merchant_name || "", // Prefer name over merchant_name
                  -plaidTx.amount, // Flip sign
                  plaidTx.authorized_date ?? plaidTx.date, // Prefer authorized_date
                  new Date().toISOString(),
                  plaidTx.transaction_id,
                  plaidTx.name,
                  plaidTx.name,
                  plaidTx.merchant_name ?? null,
                  plaidTx.authorized_date ?? null,
                  plaidTx.date,
                ]
              );
              result.added++;
            }
          }
        }

        // 4. Process modified transactions
        for (const plaidTx of modified) {
          if (plaidTx.pending) continue;

          const localAccountId = accountMap.get(plaidTx.account_id);
          if (!localAccountId) continue;

          const existing = adapter.get<{ id: string }>(
            "SELECT id FROM transactions WHERE plaid_transaction_id = ?",
            [plaidTx.transaction_id]
          );

          if (existing) {
            adapter.run(
              `UPDATE transactions SET
                description = ?,
                amount = ?,
                date = ?,
                plaid_merchant_name = ?,
                plaid_authorized_date = ?,
                plaid_posted_date = ?,
                plaid_name = ?,
                plaid_original_description = ?
              WHERE id = ?`,
              [
                plaidTx.name || plaidTx.merchant_name || "", // Prefer name over merchant_name
                -plaidTx.amount,
                plaidTx.authorized_date ?? plaidTx.date, // Prefer authorized_date
                plaidTx.merchant_name ?? null,
                plaidTx.authorized_date ?? null,
                plaidTx.date,
                plaidTx.name,
                plaidTx.name,
                existing.id,
              ]
            );
            result.modified++;
          }
        }

        // 5. Process removed transactions
        for (const removedTx of removed) {
          adapter.run("DELETE FROM transactions WHERE plaid_transaction_id = ?", [
            removedTx.transaction_id,
          ]);
          result.removed++;
        }

        // 6. Save new cursor
        setSyncStatus({ stage: "saving" });
        adapter.run(
          `INSERT OR REPLACE INTO plaid_sync_state (item_id, cursor, last_synced_at)
           VALUES (?, ?, ?)`,
          [plaidItemId, nextCursor, new Date().toISOString()]
        );

        // 7. Save encrypted DB
        await save();

        // 8. Invalidate React Query cache
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });

        return result;
      } catch (error) {
        result.errors.push(
          error instanceof Error ? error.message : "Unknown error"
        );
        return result;
      } finally {
        syncingItemsSet.delete(plaidItemId);
        setIsSyncing(false);
        setSyncStatus(null);
      }
    },
    [adapter, isReady, save, queryClient]
  );

  /**
   * Sync all Plaid items.
   */
  const syncAllItems = useCallback(
    async (plaidItemIds: string[]): Promise<SyncResult[]> => {
      const results: SyncResult[] = [];
      for (const itemId of plaidItemIds) {
        results.push(await syncItem(itemId));
      }
      return results;
    },
    [syncItem]
  );

  return { syncItem, syncAllItems, isSyncing, syncStatus };
}

/**
 * Find category for a Plaid transaction using categorization rules.
 */
function findCategory(
  plaidTx: PlaidTransaction,
  rules: CategorizationRule[]
): string | null {
  const description = (plaidTx.name || plaidTx.merchant_name || "").toUpperCase();

  for (const rule of rules) {
    if (description.includes(rule.pattern)) {
      return rule.category_id;
    }
  }

  return null;
}
