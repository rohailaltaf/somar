"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Plaid Sync Hook
 *
 * Triggers server-side sync of Plaid transactions.
 * The server handles all the heavy lifting: fetching from Plaid, dedup,
 * and saving to PostgreSQL. This hook just triggers the sync and invalidates caches.
 */

interface SyncResult {
  plaidItemId: string;
  added: number;
  modified: number;
  removed: number;
  errors: string[];
  requiresReauth: boolean;
}

interface SyncStatus {
  stage: "syncing" | "complete";
}

interface PlaidSyncResponse {
  success: boolean;
  data?: {
    addedCount: number;
    modifiedCount: number;
    removedCount: number;
  };
  error?: {
    code: string;
    message: string;
    requiresReauth?: boolean;
  };
}

// Track which items are currently syncing (module-level to persist across hook instances)
const syncingItemsSet = new Set<string>();

export function usePlaidSync() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  /**
   * Sync a single Plaid item.
   */
  const syncItem = useCallback(
    async (plaidItemId: string): Promise<SyncResult> => {
      // Prevent concurrent syncs on the same item
      if (syncingItemsSet.has(plaidItemId)) {
        return {
          plaidItemId,
          added: 0,
          modified: 0,
          removed: 0,
          errors: [],
          requiresReauth: false,
        };
      }

      syncingItemsSet.add(plaidItemId);
      setIsSyncing(true);
      setSyncStatus({ stage: "syncing" });

      const result: SyncResult = {
        plaidItemId,
        added: 0,
        modified: 0,
        removed: 0,
        errors: [],
        requiresReauth: false,
      };

      try {
        // Call server-side sync endpoint
        const response = await fetch("/api/plaid/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plaidItemId }),
        });

        const data: PlaidSyncResponse = await response.json();

        if (!data.success || !data.data) {
          result.errors.push(data.error?.message || "Sync failed");
          result.requiresReauth = data.error?.requiresReauth || false;
          return result;
        }

        result.added = data.data.addedCount;
        result.modified = data.data.modifiedCount;
        result.removed = data.data.removedCount;

        // Invalidate React Query cache to refetch data
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["spending"] });
        queryClient.invalidateQueries({ queryKey: ["income"] });

        setSyncStatus({ stage: "complete" });
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
    [queryClient]
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
