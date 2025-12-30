/**
 * Primitive type definitions for Somar apps.
 * These are the base union types used throughout the application.
 */

/**
 * The type of financial account.
 * - checking: Bank checking/savings accounts
 * - credit_card: Credit card accounts
 * - investment: Brokerage, retirement, crypto accounts
 * - loan: Mortgages, auto loans, student loans, etc.
 */
export type AccountType = "checking" | "credit_card" | "investment" | "loan";

/**
 * The type of transaction category.
 * - spending: Expense categories (restaurant, groceries, etc.)
 * - income: Income streams (salary, freelance, etc.)
 * - transfer: Money movements (transfers, credit card payments, reimbursements)
 */
export type CategoryType = "spending" | "income" | "transfer";
