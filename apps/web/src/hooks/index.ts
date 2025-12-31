/**
 * Hook exports.
 * 
 * Hooks use services for database operations and provide React Query integration.
 * UI components should use these hooks, never call services directly.
 */

export { useDatabase, DatabaseProvider } from "./use-database";

// Transactions
export {
  useTransactions,
  useUnconfirmedTransactions,
  useUnconfirmedCount,
  useTotalSpending,
  useSpendingByCategory,
  useTransactionMutations,
} from "./use-transactions";

// Categories
export {
  useCategories,
  useCategoriesWithBudgets,
  useCategoryMutations,
} from "./use-categories";

// Accounts
export {
  useAccounts,
  usePlaidItems,
  useAccountMutations,
} from "./use-accounts";
