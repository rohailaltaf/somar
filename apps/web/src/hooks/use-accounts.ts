"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "./use-database";
import * as AccountService from "@/services/accounts";
import { getPlaidItems as getPlaidItemsAction } from "@/actions/plaid";

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
 * Hook for accessing Plaid items (from central DB via server action).
 */
export function usePlaidItems() {
  return useQuery({
    queryKey: ["plaidItems"],
    queryFn: () => getPlaidItemsAction(),
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
    mutationFn: (input: AccountService.CreateAccountInput) => {
      if (!db) throw new Error("Database not ready");
      return Promise.resolve(AccountService.createAccount(db, input));
    },
    onSuccess: invalidateAndSave,
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, name, type }: { id: string; name: string; type: AccountService.AccountType }) => {
      if (!db) throw new Error("Database not ready");
      AccountService.updateAccount(db, id, name, type);
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
