/**
 * Shared React hooks for database operations.
 * These hooks work with any platform that provides a DatabaseProvider.
 */

// Database context (platform-agnostic)
export {
  DatabaseContext,
  useDatabaseAdapter,
  type DatabaseContextValue,
} from "./database-context";

// Transaction hooks
export {
  useTransactions,
  useUnconfirmedTransactions,
  useRecentTransactions,
  useUnconfirmedCount,
  useTotalSpending,
  useSpendingByCategory,
  useTransactionMutations,
  type TransactionFilterOptions,
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
