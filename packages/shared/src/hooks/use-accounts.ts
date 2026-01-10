"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as AccountService from "../services/accounts";
import type { AccountType, CreateAccountInput } from "../types";

/**
 * Hook for accessing accounts.
 */
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => AccountService.getAllAccounts(),
  });
}

/**
 * Hook for account mutations (create, update, delete).
 */
export function useAccountMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const createAccount = useMutation({
    mutationFn: (input: CreateAccountInput) =>
      AccountService.createAccount(input),
    onSuccess: invalidate,
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, name, type, plaidAccountId }: { id: string; name: string; type: AccountType; plaidAccountId?: string | null }) =>
      AccountService.updateAccount(id, name, type, plaidAccountId),
    onSuccess: invalidate,
  });

  const deleteAccount = useMutation({
    mutationFn: (id: string) =>
      AccountService.deleteAccount(id),
    onSuccess: invalidate,
  });

  return {
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
