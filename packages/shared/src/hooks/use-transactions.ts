"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["transactions", options],
    queryFn: () =>
      options
        ? TransactionService.getTransactionsFiltered(options)
        : TransactionService.getAllTransactions(),
  });
}

/**
 * Hook for getting unconfirmed transactions (for tagger).
 */
export function useUnconfirmedTransactions() {
  return useQuery({
    queryKey: ["transactions", "unconfirmed"],
    queryFn: () => TransactionService.getUnconfirmedTransactions(),
  });
}

/**
 * Hook for getting recent transactions with a limit (optimized for dashboards).
 */
export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: ["transactions", "recent", limit],
    queryFn: () => TransactionService.getRecentTransactions(limit),
  });
}

/**
 * Hook for getting unconfirmed count (for dashboard badge).
 */
export function useUnconfirmedCount() {
  return useQuery({
    queryKey: ["transactions", "unconfirmedCount"],
    queryFn: () => TransactionService.getUnconfirmedCount(),
  });
}

/**
 * Hook for getting total spending for a month.
 */
export function useTotalSpending(month: string) {
  return useQuery({
    queryKey: ["spending", "total", month],
    queryFn: () => TransactionService.getTotalSpending(month),
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
  return useQuery({
    queryKey: ["spending", "byCategory", month, options],
    queryFn: () => TransactionService.getSpendingByCategory(month, options),
  });
}

/**
 * Hook for transaction mutations (create, update, delete).
 */
export function useTransactionMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["spending"] });
  };

  const createTransaction = useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      TransactionService.createTransaction(input),
    onSuccess: invalidate,
  });

  const createManyTransactions = useMutation({
    mutationFn: (inputs: CreateTransactionInput[]) =>
      TransactionService.createManyTransactions(inputs),
    onSuccess: invalidate,
  });

  const confirmTransaction = useMutation({
    mutationFn: ({ transactionId, categoryId }: { transactionId: string; categoryId: string }) =>
      TransactionService.confirmTransaction(transactionId, categoryId),
    onSuccess: invalidate,
  });

  const updateCategory = useMutation({
    mutationFn: ({ transactionId, categoryId, isConfirmed }: { transactionId: string; categoryId: string | null; isConfirmed?: boolean }) =>
      TransactionService.updateTransactionCategory(transactionId, categoryId, isConfirmed),
    onSuccess: invalidate,
  });

  const toggleExcluded = useMutation({
    mutationFn: (transactionId: string) =>
      TransactionService.toggleTransactionExcluded(transactionId),
    onSuccess: invalidate,
  });

  const deleteTransaction = useMutation({
    mutationFn: (transactionId: string) =>
      TransactionService.deleteTransaction(transactionId),
    onSuccess: invalidate,
  });

  const uncategorize = useMutation({
    mutationFn: (transactionId: string) =>
      TransactionService.uncategorizeTransaction(transactionId),
    onSuccess: invalidate,
  });

  return {
    createTransaction,
    createManyTransactions,
    confirmTransaction,
    updateCategory,
    toggleExcluded,
    deleteTransaction,
    uncategorize,
  };
}
