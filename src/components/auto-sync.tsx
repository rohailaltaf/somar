"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface AutoSyncProps {
  itemsNeedingSync: string[];
}

export function AutoSync({ itemsNeedingSync }: AutoSyncProps) {
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once per mount
    if (hasSynced.current || itemsNeedingSync.length === 0) return;
    hasSynced.current = true;

    // Run sync in background (non-blocking)
    const syncInBackground = async () => {
      try {
        const response = await fetch("/api/plaid/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // Sync all items
        });

        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];
          
          // Calculate totals
          const totalAdded = results.reduce(
            (sum: number, r: { added: number }) => sum + r.added,
            0
          );
          const totalModified = results.reduce(
            (sum: number, r: { modified: number }) => sum + r.modified,
            0
          );

          // Only show toast if there were changes
          if (totalAdded > 0 || totalModified > 0) {
            toast.success(
              `Synced ${totalAdded} new transaction${totalAdded !== 1 ? "s" : ""}${
                totalModified > 0 ? `, ${totalModified} updated` : ""
              }`
            );
          }
        }
      } catch (error) {
        // Silently fail - user can manually sync if needed
        console.error("Auto-sync failed:", error);
      }
    };

    // Small delay to not block initial render
    const timeoutId = setTimeout(syncInBackground, 1000);

    return () => clearTimeout(timeoutId);
  }, [itemsNeedingSync]);

  // This component doesn't render anything
  return null;
}




