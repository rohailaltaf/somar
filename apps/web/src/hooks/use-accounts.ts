"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "./use-database";
import * as AccountService from "@/services/accounts";
import type { AccountType, CreateAccountInput, PlaidItemWithAccounts } from "@somar/shared";

/**
 * Hook for accessing accounts.
 */
export function useAccounts() {
  const { db, isReady } = useDatabase();

  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => {
      if (!db) return [];
      return AccountService.getAllAccounts(db);
    },
    enabled: isReady,
  });
}

/**
 * Hook for accessing Plaid items (from central DB via API route).
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

/**
 * Hook for account mutations (create, update, delete).
 */
export function useAccountMutations() {
  const { db, isReady, save, vacuum } = useDatabase();
  const queryClient = useQueryClient();

  const invalidateAndSave = async () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    // Trigger save to persist changes to server
    await save();
  };

  const createAccount = useMutation({
    mutationFn: (input: CreateAccountInput) => {
      if (!db) throw new Error("Database not ready");
      return Promise.resolve(AccountService.createAccount(db, input));
    },
    onSuccess: invalidateAndSave,
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, name, type, plaidAccountId }: { id: string; name: string; type: AccountType; plaidAccountId?: string | null }) => {
      if (!db) throw new Error("Database not ready");
      AccountService.updateAccount(db, id, name, type, plaidAccountId);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      if (!db) throw new Error("Database not ready");
      AccountService.deleteAccount(db, id);
      // Run VACUUM to reclaim disk space after deleting transactions
      db.run("VACUUM");
    },
    onSuccess: invalidateAndSave,
  });

  return {
    createAccount,
    updateAccount,
    deleteAccount,
    vacuum,
    isReady,
  };
}
