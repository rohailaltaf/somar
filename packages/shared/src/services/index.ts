/**
 * Shared service layer exports.
 * These services provide API client operations for data access.
 * All functions are async and call the backend API.
 */

// Transaction operations
export {
  getAllTransactions,
  getTransactionsFiltered,
  getTransactionsPaginated,
  getUnconfirmedTransactions,
  getRecentTransactions,
  getUnconfirmedCount,
  getTotalSpending,
  getSpendingByCategory,
  getDailyCumulativeSpending,
  getYearToDateSpending,
  getYearToDateCategorySpending,
  getMonthlyCumulativeSpending,
  getSpendingTransactions,
  getYearSpendingTransactions,
  getTotalIncome,
  getIncomeByCategory,
  getYearToDateIncome,
  getYearToDateCategoryIncome,
  getMonthlyIncome,
  createTransaction,
  createManyTransactions,
  updateTransactionCategory,
  confirmTransaction,
  toggleTransactionExcluded,
  deleteTransaction,
  uncategorizeTransaction,
  extractMerchantPattern,
  type PaginatedTransactionsResult,
  type SpendingTransaction,
  type SpendingByCategoryOptions,
} from "./transactions";

// Account operations
export {
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "./accounts";

// Category operations
export {
  getAllCategories,
  getCategoriesByType,
  getCategoriesWithBudgets,
  createCategory,
  updateCategory,
  deleteCategory,
  setBudget,
  deleteBudget,
} from "./categories";

// User operations
export { getMe, type MeResponse } from "./user";
