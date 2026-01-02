"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabaseAdapter } from "./database-context";
import * as AccountService from "../services/accounts";
import type { AccountType, CreateAccountInput } from "../types";

/**
 * Hook for accessing accounts from the local database.
 */
export function useAccounts() {
  const { adapter, isReady } = useDatabaseAdapter();

  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => {
      if (!adapter) return [];
      return AccountService.getAllAccounts(adapter);
    },
    enabled: isReady,
  });
}

/**
 * Hook for account mutations (create, update, delete).
 */
export function useAccountMutations() {
  const { adapter, isReady, save, vacuum } = useDatabaseAdapter();
  const queryClient = useQueryClient();

  const invalidateAndSave = async () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    // Trigger save to persist changes to server
    await save();
  };

  const createAccount = useMutation({
    mutationFn: (input: CreateAccountInput) => {
      if (!adapter) throw new Error("Database not ready");
      return Promise.resolve(AccountService.createAccount(adapter, input));
    },
    onSuccess: invalidateAndSave,
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, name, type, plaidAccountId }: { id: string; name: string; type: AccountType; plaidAccountId?: string | null }) => {
      if (!adapter) throw new Error("Database not ready");
      AccountService.updateAccount(adapter, id, name, type, plaidAccountId);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      if (!adapter) throw new Error("Database not ready");
      AccountService.deleteAccount(adapter, id);
      // Run VACUUM to reclaim disk space after deleting transactions
      vacuum();
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
