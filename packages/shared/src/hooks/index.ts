/**
 * Shared React hooks for data operations.
 * These hooks use React Query and call the API client.
 */

// Transaction hooks
export {
  useTransactions,
  useTransactionsPaginated,
  useUnconfirmedTransactions,
  useRecentTransactions,
  useUnconfirmedCount,
  useTotalSpending,
  useSpendingByCategory,
  useTransactionMutations,
  type TransactionFilterOptions,
  type TransactionPaginationOptions,
  type SpendingByCategoryOptions,
} from "./use-transactions";

// Account hooks
export {
  useAccounts,
  useAccountMutations,
} from "./use-accounts";

// Category hooks
export {
  useCategories,
  useCategoriesWithBudgets,
  useCategoryMutations,
} from "./use-categories";
