/**
 * Shared service layer exports.
 * These services provide platform-agnostic database operations
 * using the DatabaseAdapter interface.
 */

// Transaction operations
export {
  getAllTransactions,
  getTransactionsFiltered,
  getUnconfirmedTransactions,
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
  type SpendingTransaction,
  type SpendingByCategoryOptions,
} from "./transactions";

// Account operations
export {
  getAllAccounts,
  getAccountById,
  getManualAccounts,
  getPlaidAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "./accounts";

// Category operations
export {
  getAllCategories,
  getCategoriesByType,
  getCategoriesWithBudgets,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  setBudget,
  deleteBudget,
} from "./categories";
