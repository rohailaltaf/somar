/**
 * Transaction service - encapsulates all transaction-related database operations.
 * This is a pure data layer with NO React/UI dependencies.
 *
 * Uses DatabaseAdapter interface for platform-agnostic database access.
 */

import type { DatabaseAdapter } from "../storage";
import type {
  AccountType,
  CategoryType,
  CreateTransactionInput,
  Transaction,
  TransactionWithRelations,
} from "../types";

// ============ Queries ============

export function getAllTransactions(db: DatabaseAdapter): TransactionWithRelations[] {
  const rows = db.all<RawTransaction>(
    `SELECT
       t.*,
       c.id as cat_id, c.name as cat_name, c.type as cat_type, c.color as cat_color, c.created_at as cat_created_at,
       a.id as acc_id, a.name as acc_name, a.type as acc_type, a.created_at as acc_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN accounts a ON t.account_id = a.id
     ORDER BY t.date DESC, t.created_at DESC`
  );

  return rows.map(mapTransactionRow);
}

export function getTransactionsFiltered(
  db: DatabaseAdapter,
  options: {
    accountId?: string;
    categoryId?: string | null;
    startDate?: string;
    endDate?: string;
    showExcluded?: boolean;
    search?: string;
  }
): TransactionWithRelations[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.accountId) {
    conditions.push("t.account_id = ?");
    params.push(options.accountId);
  }

  if (options.categoryId === null) {
    conditions.push("t.category_id IS NULL");
  } else if (options.categoryId) {
    conditions.push("t.category_id = ?");
    params.push(options.categoryId);
  }

  if (options.startDate) {
    conditions.push("t.date >= ?");
    params.push(options.startDate);
  }

  if (options.endDate) {
    conditions.push("t.date <= ?");
    params.push(options.endDate);
  }

  if (!options.showExcluded) {
    conditions.push("t.excluded = 0");
  }

  if (options.search) {
    conditions.push("LOWER(t.description) LIKE LOWER(?)");
    params.push(`%${options.search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db.all<RawTransaction>(
    `SELECT
       t.*,
       c.id as cat_id, c.name as cat_name, c.type as cat_type, c.color as cat_color, c.created_at as cat_created_at,
       a.id as acc_id, a.name as acc_name, a.type as acc_type, a.created_at as acc_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN accounts a ON t.account_id = a.id
     ${whereClause}
     ORDER BY t.date DESC, t.created_at DESC`,
    params
  );

  return rows.map(mapTransactionRow);
}

export function getUnconfirmedTransactions(db: DatabaseAdapter): TransactionWithRelations[] {
  const rows = db.all<RawTransaction>(
    `SELECT
       t.*,
       c.id as cat_id, c.name as cat_name, c.type as cat_type, c.color as cat_color, c.created_at as cat_created_at,
       a.id as acc_id, a.name as acc_name, a.type as acc_type, a.created_at as acc_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN accounts a ON t.account_id = a.id
     WHERE t.is_confirmed = 0
     ORDER BY t.date DESC, t.created_at DESC`
  );

  return rows.map(mapTransactionRow);
}

export function getUnconfirmedCount(db: DatabaseAdapter): number {
  const result = db.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM transactions WHERE is_confirmed = 0"
  );
  return result?.count ?? 0;
}

export function getTotalSpending(db: DatabaseAdapter, month: string): number {
  const result = db.get<{ total: number }>(
    `SELECT COALESCE(SUM(ABS(amount)), 0) as total
     FROM transactions
     WHERE amount < 0
       AND excluded = 0
       AND date LIKE ?`,
    [`${month}%`]
  );
  return result?.total ?? 0;
}

export function getSpendingByCategory(
  db: DatabaseAdapter,
  month: string
): Array<{ id: string; name: string; color: string; spent: number; budget: number | null }> {
  const rows = db.all<{
    id: string;
    name: string;
    color: string;
    spent: number;
    budget_amount: number | null;
  }>(
    `SELECT
       c.id, c.name, c.color,
       COALESCE(SUM(ABS(t.amount)), 0) as spent,
       (SELECT cb.amount FROM category_budgets cb
        WHERE cb.category_id = c.id AND cb.start_month <= ?
        ORDER BY cb.start_month DESC LIMIT 1) as budget_amount
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.amount < 0
       AND t.excluded = 0
       AND t.date LIKE ?
     WHERE c.type = 'spending'
     GROUP BY c.id
     ORDER BY spent DESC`,
    [month, `${month}%`]
  );

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    color: r.color,
    spent: r.spent,
    budget: r.budget_amount,
  }));
}

export function getDailyCumulativeSpending(
  db: DatabaseAdapter,
  month: string
): Array<{ day: number; date: string; cumulative: number }> {
  const rows = db.all<{ day: number; date: string; cumulative: number }>(
    `WITH daily_spending AS (
       SELECT
         CAST(SUBSTR(date, 9, 2) AS INTEGER) as day,
         date,
         SUM(ABS(amount)) as daily_total
       FROM transactions
       WHERE amount < 0
         AND excluded = 0
         AND date LIKE ?
       GROUP BY date
     )
     SELECT
       day,
       date,
       SUM(daily_total) OVER (ORDER BY date) as cumulative
     FROM daily_spending
     ORDER BY date`,
    [`${month}%`]
  );
  return rows;
}

export function getYearToDateSpending(db: DatabaseAdapter, year: number): number {
  const result = db.get<{ total: number }>(
    `SELECT COALESCE(SUM(ABS(amount)), 0) as total
     FROM transactions
     WHERE amount < 0
       AND excluded = 0
       AND date LIKE ?`,
    [`${year}%`]
  );
  return result?.total ?? 0;
}

export function getYearToDateCategorySpending(
  db: DatabaseAdapter,
  year: number
): Array<{ id: string; name: string; color: string; spent: number; budget: number | null }> {
  const currentMonth = `${year}-12`;
  const rows = db.all<{
    id: string;
    name: string;
    color: string;
    spent: number;
    budget_amount: number | null;
  }>(
    `SELECT
       c.id, c.name, c.color,
       COALESCE(SUM(ABS(t.amount)), 0) as spent,
       (SELECT cb.amount FROM category_budgets cb
        WHERE cb.category_id = c.id AND cb.start_month <= ?
        ORDER BY cb.start_month DESC LIMIT 1) as budget_amount
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.amount < 0
       AND t.excluded = 0
       AND t.date LIKE ?
     WHERE c.type = 'spending'
     GROUP BY c.id
     ORDER BY spent DESC`,
    [currentMonth, `${year}%`]
  );

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    color: r.color,
    spent: r.spent,
    budget: r.budget_amount,
  }));
}

export function getMonthlyCumulativeSpending(
  db: DatabaseAdapter,
  year: number
): Array<{ month: number; monthStr: string; cumulative: number }> {
  const rows = db.all<{ month: number; monthStr: string; cumulative: number }>(
    `WITH monthly_spending AS (
       SELECT
         CAST(SUBSTR(date, 6, 2) AS INTEGER) as month,
         SUBSTR(date, 1, 7) as monthStr,
         SUM(ABS(amount)) as monthly_total
       FROM transactions
       WHERE amount < 0
         AND excluded = 0
         AND date LIKE ?
       GROUP BY monthStr
     )
     SELECT
       month,
       monthStr,
       SUM(monthly_total) OVER (ORDER BY monthStr) as cumulative
     FROM monthly_spending
     ORDER BY monthStr`,
    [`${year}%`]
  );
  return rows;
}

export interface SpendingTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryName: string | null;
  categoryColor: string | null;
  accountName: string | null;
}

export function getSpendingTransactions(db: DatabaseAdapter, month: string): SpendingTransaction[] {
  return db.all<SpendingTransaction>(
    `SELECT
       t.id,
       t.description,
       ABS(t.amount) as amount,
       t.date,
       c.name as categoryName,
       c.color as categoryColor,
       a.name as accountName
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN accounts a ON t.account_id = a.id
     WHERE t.amount < 0
       AND t.excluded = 0
       AND t.date LIKE ?
     ORDER BY t.date DESC`,
    [`${month}%`]
  );
}

export function getYearSpendingTransactions(db: DatabaseAdapter, year: number): SpendingTransaction[] {
  return db.all<SpendingTransaction>(
    `SELECT
       t.id,
       t.description,
       ABS(t.amount) as amount,
       t.date,
       c.name as categoryName,
       c.color as categoryColor,
       a.name as accountName
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN accounts a ON t.account_id = a.id
     WHERE t.amount < 0
       AND t.excluded = 0
       AND t.date LIKE ?
     ORDER BY t.date DESC`,
    [`${year}%`]
  );
}

export function getTotalIncome(db: DatabaseAdapter, month: string): number {
  const result = db.get<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE amount > 0
       AND excluded = 0
       AND date LIKE ?`,
    [`${month}%`]
  );
  return result?.total ?? 0;
}

export function getIncomeByCategory(
  db: DatabaseAdapter,
  month: string
): Array<{ id: string; name: string; color: string; income: number }> {
  const rows = db.all<{
    id: string;
    name: string;
    color: string;
    income: number;
  }>(
    `SELECT
       c.id, c.name, c.color,
       COALESCE(SUM(t.amount), 0) as income
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.amount > 0
       AND t.excluded = 0
       AND t.date LIKE ?
     WHERE c.type = 'income'
     GROUP BY c.id
     ORDER BY income DESC`,
    [`${month}%`]
  );

  return rows;
}

export function getYearToDateIncome(db: DatabaseAdapter, year: number): number {
  const result = db.get<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE amount > 0
       AND excluded = 0
       AND date LIKE ?`,
    [`${year}%`]
  );
  return result?.total ?? 0;
}

export function getYearToDateCategoryIncome(
  db: DatabaseAdapter,
  year: number
): Array<{ id: string; name: string; color: string; income: number }> {
  const rows = db.all<{
    id: string;
    name: string;
    color: string;
    income: number;
  }>(
    `SELECT
       c.id, c.name, c.color,
       COALESCE(SUM(t.amount), 0) as income
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.amount > 0
       AND t.excluded = 0
       AND t.date LIKE ?
     WHERE c.type = 'income'
     GROUP BY c.id
     ORDER BY income DESC`,
    [`${year}%`]
  );

  return rows;
}

export function getMonthlyIncome(
  db: DatabaseAdapter,
  year: number
): Array<{ month: number; monthStr: string; amount: number }> {
  const rows = db.all<{ month: number; monthStr: string; amount: number }>(
    `SELECT
       CAST(SUBSTR(date, 6, 2) AS INTEGER) as month,
       SUBSTR(date, 1, 7) as monthStr,
       COALESCE(SUM(amount), 0) as amount
     FROM transactions
     WHERE amount > 0
       AND excluded = 0
       AND date LIKE ?
     GROUP BY monthStr
     ORDER BY monthStr`,
    [`${year}%`]
  );
  return rows;
}

// ============ Mutations ============

export function createTransaction(db: DatabaseAdapter, input: CreateTransactionInput): string {
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO transactions (id, account_id, category_id, description, amount, date, excluded, is_confirmed, created_at, plaid_transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    [
      id,
      input.accountId,
      input.categoryId ?? null,
      input.description,
      input.amount,
      input.date,
      new Date().toISOString(),
      input.plaidTransactionId ?? null,
    ]
  );
  return id;
}

export function createManyTransactions(db: DatabaseAdapter, inputs: CreateTransactionInput[]): string[] {
  const ids: string[] = [];
  for (const input of inputs) {
    ids.push(createTransaction(db, input));
  }
  return ids;
}

export function updateTransactionCategory(
  db: DatabaseAdapter,
  transactionId: string,
  categoryId: string | null,
  isConfirmed: boolean = true
): void {
  db.run(
    "UPDATE transactions SET category_id = ?, is_confirmed = ? WHERE id = ?",
    [categoryId, isConfirmed ? 1 : 0, transactionId]
  );
}

export function confirmTransaction(
  db: DatabaseAdapter,
  transactionId: string,
  categoryId: string
): { autoTaggedCount: number } {
  // Get the transaction
  const transaction = db.get<{ description: string }>(
    "SELECT description FROM transactions WHERE id = ?",
    [transactionId]
  );

  if (!transaction) {
    return { autoTaggedCount: 0 };
  }

  // Update this transaction
  db.run(
    "UPDATE transactions SET category_id = ?, is_confirmed = 1 WHERE id = ?",
    [categoryId, transactionId]
  );

  // Learn the pattern
  const pattern = extractMerchantPattern(transaction.description);
  let autoTaggedCount = 0;

  if (pattern) {
    // Upsert the rule
    const existingRule = db.get<{ id: string }>(
      "SELECT id FROM categorization_rules WHERE pattern = ?",
      [pattern]
    );

    if (existingRule) {
      db.run(
        "UPDATE categorization_rules SET category_id = ? WHERE pattern = ?",
        [categoryId, pattern]
      );
    } else {
      db.run(
        `INSERT INTO categorization_rules (id, pattern, category_id, is_preset, created_at)
         VALUES (?, ?, ?, 0, ?)`,
        [crypto.randomUUID(), pattern, categoryId, new Date().toISOString()]
      );
    }

    // Auto-tag other unconfirmed transactions with similar pattern
    const unconfirmed = db.all<{ id: string; description: string }>(
      "SELECT id, description FROM transactions WHERE is_confirmed = 0 AND id != ?",
      [transactionId]
    );

    for (const txn of unconfirmed) {
      const txnPattern = extractMerchantPattern(txn.description);
      if (txnPattern === pattern || txn.description.toUpperCase().includes(pattern)) {
        db.run(
          "UPDATE transactions SET category_id = ? WHERE id = ? AND is_confirmed = 0",
          [categoryId, txn.id]
        );
        autoTaggedCount++;
      }
    }
  }

  return { autoTaggedCount };
}

export function toggleTransactionExcluded(db: DatabaseAdapter, transactionId: string): void {
  db.run(
    "UPDATE transactions SET excluded = CASE WHEN excluded = 0 THEN 1 ELSE 0 END WHERE id = ?",
    [transactionId]
  );
}

export function deleteTransaction(db: DatabaseAdapter, transactionId: string): void {
  db.run("DELETE FROM transactions WHERE id = ?", [transactionId]);
}

export function uncategorizeTransaction(db: DatabaseAdapter, transactionId: string): void {
  db.run(
    "UPDATE transactions SET category_id = NULL, is_confirmed = 0 WHERE id = ?",
    [transactionId]
  );
}

// ============ Helpers ============

interface RawTransaction {
  id: string;
  account_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  date: string;
  excluded: number;
  is_confirmed: number;
  created_at: string;
  plaid_transaction_id: string | null;
  plaid_authorized_date: string | null;
  plaid_posted_date: string | null;
  plaid_merchant_name: string | null;
  cat_id: string | null;
  cat_name: string | null;
  cat_type: string | null;
  cat_color: string | null;
  cat_created_at: string | null;
  acc_id: string;
  acc_name: string;
  acc_type: string;
  acc_created_at: string;
}

function mapTransactionRow(row: RawTransaction): TransactionWithRelations {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    description: row.description,
    amount: row.amount,
    date: row.date,
    excluded: row.excluded === 1,
    isConfirmed: row.is_confirmed === 1,
    createdAt: row.created_at,
    plaidTransactionId: row.plaid_transaction_id,
    plaidAuthorizedDate: row.plaid_authorized_date,
    plaidPostedDate: row.plaid_posted_date,
    plaidMerchantName: row.plaid_merchant_name,
    category: row.cat_id
      ? {
          id: row.cat_id,
          name: row.cat_name!,
          type: row.cat_type as CategoryType,
          color: row.cat_color!,
          createdAt: row.cat_created_at!,
        }
      : null,
    account: {
      id: row.acc_id,
      name: row.acc_name,
      type: row.acc_type as AccountType,
      createdAt: row.acc_created_at,
      plaidItemId: null,
      plaidAccountId: null,
    },
  };
}

/**
 * Extract a short, general merchant pattern from a transaction description.
 */
export function extractMerchantPattern(description: string): string {
  let pattern = description.toUpperCase();

  // Remove common prefixes
  const prefixes = [
    "PURCHASE ", "POS ", "DEBIT ", "ACH ", "CHECKCARD ",
    "VISA ", "MASTERCARD ", "AMEX ", "RECURRING ", "PAYMENT ",
    "MOBILE ", "ONLINE ", "INTERNET ", "ELECTRONIC ",
  ];

  for (const prefix of prefixes) {
    if (pattern.startsWith(prefix)) {
      pattern = pattern.substring(prefix.length);
    }
  }

  // Remove common suffixes (transaction types)
  const suffixes = [
    " PAYROLL", " DIR DEP", " PPD", " WEB", " ACH",
    " DEBIT", " CREDIT", " PAYMENT", " TRANSFER",
  ];

  for (const suffix of suffixes) {
    if (pattern.endsWith(suffix)) {
      pattern = pattern.substring(0, pattern.length - suffix.length);
    }
  }

  // Remove trailing IDs, dates, reference numbers
  pattern = pattern.replace(/\s+[A-Z0-9]{6,}$/g, "");
  pattern = pattern.replace(/\s+#\d+$/g, "");
  pattern = pattern.replace(/\s+\d{2,}\/\d{2,}$/g, "");

  // Truncate to first 3 words if still too long
  const words = pattern.trim().split(/\s+/);
  if (words.length > 3) {
    pattern = words.slice(0, 3).join(" ");
  }

  return pattern.trim();
}
