"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlaidItemWithAccounts } from "@somar/shared";

/**
 * Hook for accessing Plaid items (from central DB via API route).
 * This is web-specific as it calls the web API endpoint.
 */
export function usePlaidItems() {
  return useQuery({
    queryKey: ["plaidItems"],
    queryFn: async (): Promise<PlaidItemWithAccounts[]> => {
      const response = await fetch("/api/plaid/items");
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch Plaid items");
      }
      return data.data;
    },
  });
}
