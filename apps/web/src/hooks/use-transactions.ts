"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "./use-database";
import * as TransactionService from "@/services/transactions";

/**
 * Hook for accessing transactions with filtering and relations.
 */
export function useTransactions(options?: {
  accountId?: string;
  categoryId?: string | null;
  startDate?: string;
  endDate?: string;
  showExcluded?: boolean;
  search?: string;
}) {
  const { db, isReady } = useDatabase();

  return useQuery({
    queryKey: ["transactions", options],
    queryFn: () => {
      if (!db) return [];
      return options
        ? TransactionService.getTransactionsFiltered(db, options)
        : TransactionService.getAllTransactions(db);
    },
    enabled: isReady,
  });
}

/**
 * Hook for getting unconfirmed transactions (for tagger).
 */
export function useUnconfirmedTransactions() {
  const { db, isReady } = useDatabase();

  return useQuery({
    queryKey: ["transactions", "unconfirmed"],
    queryFn: () => {
      if (!db) return [];
      return TransactionService.getUnconfirmedTransactions(db);
    },
    enabled: isReady,
  });
}

/**
 * Hook for getting unconfirmed count (for dashboard badge).
 */
export function useUnconfirmedCount() {
  const { db, isReady } = useDatabase();

  return useQuery({
    queryKey: ["transactions", "unconfirmedCount"],
    queryFn: () => {
      if (!db) return 0;
      return TransactionService.getUnconfirmedCount(db);
    },
    enabled: isReady,
  });
}

/**
 * Hook for getting total spending for a month.
 */
export function useTotalSpending(month: string) {
  const { db, isReady } = useDatabase();

  return useQuery({
    queryKey: ["spending", "total", month],
    queryFn: () => {
      if (!db) return 0;
      return TransactionService.getTotalSpending(db, month);
    },
    enabled: isReady,
  });
}

/**
 * Hook for getting spending by category for a month.
 */
export function useSpendingByCategory(month: string) {
  const { db, isReady } = useDatabase();

  return useQuery({
    queryKey: ["spending", "byCategory", month],
    queryFn: () => {
      if (!db) return [];
      return TransactionService.getSpendingByCategory(db, month);
    },
    enabled: isReady,
  });
}

/**
 * Hook for transaction mutations (create, update, delete).
 */
export function useTransactionMutations() {
  const { db, isReady, save } = useDatabase();
  const queryClient = useQueryClient();

  const invalidateAndSave = async () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["spending"] });
    // Trigger save to persist changes to server
    await save();
  };

  const createTransaction = useMutation({
    mutationFn: (input: TransactionService.CreateTransactionInput) => {
      if (!db) throw new Error("Database not ready");
      return Promise.resolve(TransactionService.createTransaction(db, input));
    },
    onSuccess: invalidateAndSave,
  });

  const createManyTransactions = useMutation({
    mutationFn: (inputs: TransactionService.CreateTransactionInput[]) => {
      if (!db) throw new Error("Database not ready");
      return Promise.resolve(TransactionService.createManyTransactions(db, inputs));
    },
    onSuccess: invalidateAndSave,
  });

  const confirmTransaction = useMutation({
    mutationFn: ({ transactionId, categoryId }: { transactionId: string; categoryId: string }) => {
      if (!db) throw new Error("Database not ready");
      return Promise.resolve(TransactionService.confirmTransaction(db, transactionId, categoryId));
    },
    onSuccess: invalidateAndSave,
  });

  const updateCategory = useMutation({
    mutationFn: ({ transactionId, categoryId, isConfirmed }: { transactionId: string; categoryId: string | null; isConfirmed?: boolean }) => {
      if (!db) throw new Error("Database not ready");
      TransactionService.updateTransactionCategory(db, transactionId, categoryId, isConfirmed);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const toggleExcluded = useMutation({
    mutationFn: (transactionId: string) => {
      if (!db) throw new Error("Database not ready");
      TransactionService.toggleTransactionExcluded(db, transactionId);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const deleteTransaction = useMutation({
    mutationFn: (transactionId: string) => {
      if (!db) throw new Error("Database not ready");
      TransactionService.deleteTransaction(db, transactionId);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const uncategorize = useMutation({
    mutationFn: (transactionId: string) => {
      if (!db) throw new Error("Database not ready");
      TransactionService.uncategorizeTransaction(db, transactionId);
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
