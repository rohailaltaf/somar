"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabaseAdapter } from "./database-context";
import * as TransactionService from "../services/transactions";
import type { CreateTransactionInput } from "../types";

/**
 * Filter options for transaction queries.
 */
export interface TransactionFilterOptions {
  accountId?: string;
  categoryId?: string | null;
  startDate?: string;
  endDate?: string;
  showExcluded?: boolean;
  search?: string;
}

/**
 * Hook for accessing transactions with filtering and relations.
 */
export function useTransactions(options?: TransactionFilterOptions) {
  const { adapter, isReady } = useDatabaseAdapter();

  return useQuery({
    queryKey: ["transactions", options],
    queryFn: () => {
      if (!adapter) return [];
      return options
        ? TransactionService.getTransactionsFiltered(adapter, options)
        : TransactionService.getAllTransactions(adapter);
    },
    enabled: isReady,
  });
}

/**
 * Hook for getting unconfirmed transactions (for tagger).
 */
export function useUnconfirmedTransactions() {
  const { adapter, isReady } = useDatabaseAdapter();

  return useQuery({
    queryKey: ["transactions", "unconfirmed"],
    queryFn: () => {
      if (!adapter) return [];
      return TransactionService.getUnconfirmedTransactions(adapter);
    },
    enabled: isReady,
  });
}

/**
 * Hook for getting recent transactions with a limit (optimized for dashboards).
 * Uses database-level LIMIT for O(1) performance regardless of total transaction count.
 */
export function useRecentTransactions(limit = 5) {
  const { adapter, isReady } = useDatabaseAdapter();

  return useQuery({
    queryKey: ["transactions", "recent", limit],
    queryFn: () => {
      if (!adapter) return [];
      return TransactionService.getRecentTransactions(adapter, limit);
    },
    enabled: isReady,
  });
}

/**
 * Hook for getting unconfirmed count (for dashboard badge).
 */
export function useUnconfirmedCount() {
  const { adapter, isReady } = useDatabaseAdapter();

  return useQuery({
    queryKey: ["transactions", "unconfirmedCount"],
    queryFn: () => {
      if (!adapter) return 0;
      return TransactionService.getUnconfirmedCount(adapter);
    },
    enabled: isReady,
  });
}

/**
 * Hook for getting total spending for a month.
 */
export function useTotalSpending(month: string) {
  const { adapter, isReady } = useDatabaseAdapter();

  return useQuery({
    queryKey: ["spending", "total", month],
    queryFn: () => {
      if (!adapter) return 0;
      return TransactionService.getTotalSpending(adapter, month);
    },
    enabled: isReady,
  });
}

/**
 * Options for spending by category query.
 */
export interface SpendingByCategoryOptions {
  /** Only include categories with spending above this amount */
  minSpent?: number;
  /** Limit the number of results returned */
  limit?: number;
}

/**
 * Hook for getting spending by category for a month.
 */
export function useSpendingByCategory(month: string, options?: SpendingByCategoryOptions) {
  const { adapter, isReady } = useDatabaseAdapter();

  return useQuery({
    queryKey: ["spending", "byCategory", month, options],
    queryFn: () => {
      if (!adapter) return [];
      return TransactionService.getSpendingByCategory(adapter, month, options);
    },
    enabled: isReady,
  });
}

/**
 * Hook for transaction mutations (create, update, delete).
 */
export function useTransactionMutations() {
  const { adapter, isReady, save } = useDatabaseAdapter();
  const queryClient = useQueryClient();

  const invalidateAndSave = async () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["spending"] });
    // Trigger save to persist changes to server
    await save();
  };

  const createTransaction = useMutation({
    mutationFn: (input: CreateTransactionInput) => {
      if (!adapter) throw new Error("Database not ready");
      return Promise.resolve(TransactionService.createTransaction(adapter, input));
    },
    onSuccess: invalidateAndSave,
  });

  const createManyTransactions = useMutation({
    mutationFn: (inputs: CreateTransactionInput[]) => {
      if (!adapter) throw new Error("Database not ready");
      return Promise.resolve(TransactionService.createManyTransactions(adapter, inputs));
    },
    onSuccess: invalidateAndSave,
  });

  const confirmTransaction = useMutation({
    mutationFn: ({ transactionId, categoryId }: { transactionId: string; categoryId: string }) => {
      if (!adapter) throw new Error("Database not ready");
      return Promise.resolve(TransactionService.confirmTransaction(adapter, transactionId, categoryId));
    },
    onSuccess: invalidateAndSave,
  });

  const updateCategory = useMutation({
    mutationFn: ({ transactionId, categoryId, isConfirmed }: { transactionId: string; categoryId: string | null; isConfirmed?: boolean }) => {
      if (!adapter) throw new Error("Database not ready");
      TransactionService.updateTransactionCategory(adapter, transactionId, categoryId, isConfirmed);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const toggleExcluded = useMutation({
    mutationFn: (transactionId: string) => {
      if (!adapter) throw new Error("Database not ready");
      TransactionService.toggleTransactionExcluded(adapter, transactionId);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const deleteTransaction = useMutation({
    mutationFn: (transactionId: string) => {
      if (!adapter) throw new Error("Database not ready");
      TransactionService.deleteTransaction(adapter, transactionId);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const uncategorize = useMutation({
    mutationFn: (transactionId: string) => {
      if (!adapter) throw new Error("Database not ready");
      TransactionService.uncategorizeTransaction(adapter, transactionId);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  return {
    createTransaction,
    createManyTransactions,
    confirmTransaction,
    updateCategory,
    toggleExcluded,
    deleteTransaction,
    uncategorize,
    isReady,
  };
}
