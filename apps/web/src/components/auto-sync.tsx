"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDatabase } from "@/hooks/use-database";
import { usePlaidSync } from "@/hooks/use-plaid-sync";

interface AutoSyncProps {
  itemsNeedingSync: string[];
}

export function AutoSync({ itemsNeedingSync }: AutoSyncProps) {
  const { isReady } = useDatabase();
  const { syncAllItems } = usePlaidSync();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Wait for database to be ready
    if (!isReady) return;

    // Only sync once per mount
    if (hasSynced.current || itemsNeedingSync.length === 0) return;
    hasSynced.current = true;

    // Run sync in background (non-blocking)
    const syncInBackground = async () => {
      try {
        const results = await syncAllItems(itemsNeedingSync);

        // Calculate totals
        const totalAdded = results.reduce((sum, r) => sum + r.added, 0);
        const totalModified = results.reduce((sum, r) => sum + r.modified, 0);
        const totalUpgraded = results.reduce((sum, r) => sum + r.upgraded, 0);
        const requiresReauth = results.some((r) => r.requiresReauth);

        // Handle reauth needed
        if (requiresReauth) {
          toast.warning("Some accounts need to be reconnected", {
            description: "Go to Accounts to reconnect",
            duration: 5000,
          });
          return;
        }

        // Show toast if there were changes
        if (totalAdded > 0 || totalModified > 0 || totalUpgraded > 0) {
          const parts: string[] = [];
          if (totalAdded > 0) {
            parts.push(`${totalAdded} new`);
          }
          if (totalModified > 0) {
            parts.push(`${totalModified} updated`);
          }
          if (totalUpgraded > 0) {
            parts.push(`${totalUpgraded} matched`);
          }

          toast.success(`Synced: ${parts.join(", ")}`);
        }
      } catch (error) {
        // Silently fail - user can manually sync if needed
        console.error("Auto-sync failed:", error);
      }
    };

    // Small delay to not block initial render
    const timeoutId = setTimeout(syncInBackground, 1000);

    return () => clearTimeout(timeoutId);
  }, [isReady, itemsNeedingSync, syncAllItems]);

  // This component doesn't render anything
  return null;
}
