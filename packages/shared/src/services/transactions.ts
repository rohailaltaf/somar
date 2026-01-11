/**
 * Transaction service - API client for transaction operations.
 */

import { apiGet, apiPost, apiPatch, apiDelete, type ApiResponse } from "../api-client";
import type {
  CreateTransactionInput,
  TransactionWithRelations,
} from "../types";

// ============ Queries ============

export async function getAllTransactions(): Promise<TransactionWithRelations[]> {
  const response = await apiGet<ApiResponse<TransactionWithRelations[]>>("/api/transactions");
  return response.data ?? [];
}

export async function getTransactionsFiltered(options: {
  accountId?: string;
  categoryId?: string | null;
  startDate?: string;
  endDate?: string;
  showExcluded?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<TransactionWithRelations[]> {
  const params = new URLSearchParams();

  if (options.accountId) params.set("accountId", options.accountId);
  if (options.categoryId === null) params.set("categoryId", "null");
  else if (options.categoryId) params.set("categoryId", options.categoryId);
  if (options.startDate) params.set("startDate", options.startDate);
  if (options.endDate) params.set("endDate", options.endDate);
  if (options.showExcluded) params.set("showExcluded", "true");
  if (options.search) params.set("search", options.search);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));

  const response = await apiGet<ApiResponse<TransactionWithRelations[]>>(
    `/api/transactions?${params.toString()}`
  );
  return response.data ?? [];
}

export async function getUnconfirmedTransactions(): Promise<TransactionWithRelations[]> {
  const response = await apiGet<ApiResponse<TransactionWithRelations[]>>("/api/transactions/unconfirmed");
  return response.data ?? [];
}

export async function getRecentTransactions(limit = 5): Promise<TransactionWithRelations[]> {
  const response = await apiGet<ApiResponse<TransactionWithRelations[]>>(
    `/api/transactions?limit=${limit}`
  );
  return response.data ?? [];
}

export async function getUnconfirmedCount(): Promise<number> {
  const response = await apiGet<{ success: boolean; total: number }>("/api/transactions/unconfirmed");
  return response.total ?? 0;
}

export async function getTotalSpending(startDate: string, endDate: string): Promise<number> {
  const response = await apiGet<ApiResponse<{ total: number }>>(
    `/api/transactions/stats?startDate=${startDate}&endDate=${endDate}&stat=total`
  );
  return response.data?.total ?? 0;
}

export interface SpendingByCategoryOptions {
  minSpent?: number;
  limit?: number;
}

export async function getSpendingByCategory(
  startDate: string,
  endDate: string,
  options?: SpendingByCategoryOptions
): Promise<Array<{ id: string; name: string; color: string; spent: number; budget: number | null }>> {
  const response = await apiGet<ApiResponse<{ byCategory: Array<{ id: string; name: string; color: string; amount: number }> }>>(
    `/api/transactions/stats?startDate=${startDate}&endDate=${endDate}&stat=byCategory`
  );

  let results = (response.data?.byCategory ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    spent: cat.amount,
    budget: null as number | null, // Budgets fetched separately if needed
  }));

  if (options?.minSpent !== undefined) {
    results = results.filter((r) => r.spent > options.minSpent!);
  }
  if (options?.limit !== undefined) {
    results = results.slice(0, options.limit);
  }

  return results;
}

export async function getDailyCumulativeSpending(
  startDate: string,
  endDate: string
): Promise<Array<{ day: number; date: string; cumulative: number }>> {
  const response = await apiGet<ApiResponse<{ cumulative: Array<{ date: string; daily: number; cumulative: number }> }>>(
    `/api/transactions/stats?startDate=${startDate}&endDate=${endDate}&stat=cumulative`
  );

  return (response.data?.cumulative ?? []).map((item) => ({
    day: parseInt(item.date.split("-")[2]),
    date: item.date,
    cumulative: item.cumulative,
  }));
}

export async function getYearToDateSpending(year: number): Promise<number> {
  const startDate = `${year}-01-01`;
  const today = new Date();
  const endDate = today.getFullYear() === year
    ? today.toISOString().split("T")[0]
    : `${year}-12-31`;

  const response = await apiGet<ApiResponse<{ total: number }>>(
    `/api/transactions/stats?startDate=${startDate}&endDate=${endDate}&stat=total`
  );
  return response.data?.total ?? 0;
}

export async function getYearToDateCategorySpending(
  year: number
): Promise<Array<{ id: string; name: string; color: string; spent: number; budget: number | null }>> {
  const startDate = `${year}-01-01`;
  const today = new Date();
  const endDate = today.getFullYear() === year
    ? today.toISOString().split("T")[0]
    : `${year}-12-31`;

  const response = await apiGet<ApiResponse<{ byCategory: Array<{ id: string; name: string; color: string; amount: number }> }>>(
    `/api/transactions/stats?startDate=${startDate}&endDate=${endDate}&stat=byCategory`
  );

  return (response.data?.byCategory ?? [])
    .map((cat) => ({ id: cat.id, name: cat.name, color: cat.color, spent: cat.amount, budget: null }))
    .sort((a, b) => b.spent - a.spent);
}

function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

export async function getMonthlyCumulativeSpending(
  year: number
): Promise<Array<{ month: number; monthStr: string; cumulative: number }>> {
  const currentMonth = new Date().getMonth() + 1;
  const months = Array.from({ length: currentMonth }, (_, i) => i + 1);

  const totals = await Promise.all(
    months.map((m) => {
      const { startDate, endDate } = getMonthDateRange(year, m);
      return getTotalSpending(startDate, endDate);
    })
  );

  let cumulative = 0;
  return months.map((month, i) => {
    cumulative += totals[i];
    return { month, monthStr: `${year}-${String(month).padStart(2, "0")}`, cumulative };
  });
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

export async function getSpendingTransactions(startDate: string, endDate: string): Promise<SpendingTransaction[]> {
  const transactions = await getTransactionsFiltered({
    startDate,
    endDate,
    showExcluded: false,
  });

  return transactions
    .filter((t) => t.amount < 0)
    .map((t) => ({
      id: t.id,
      description: t.description,
      amount: Math.abs(t.amount),
      date: t.date,
      categoryName: t.category?.name ?? null,
      categoryColor: t.category?.color ?? null,
      accountName: t.account?.name ?? null,
    }));
}

export async function getYearSpendingTransactions(year: number): Promise<SpendingTransaction[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const transactions = await getTransactionsFiltered({
    startDate,
    endDate,
    showExcluded: false,
  });

  return transactions
    .filter((t) => t.amount < 0)
    .map((t) => ({
      id: t.id,
      description: t.description,
      amount: Math.abs(t.amount),
      date: t.date,
      categoryName: t.category?.name ?? null,
      categoryColor: t.category?.color ?? null,
      accountName: t.account?.name ?? null,
    }));
}

export async function getTotalIncome(startDate: string, endDate: string): Promise<number> {
  const response = await apiGet<ApiResponse<{ income: number }>>(
    `/api/transactions/stats?startDate=${startDate}&endDate=${endDate}&stat=income`
  );
  return response.data?.income ?? 0;
}

export async function getIncomeByCategory(
  startDate: string,
  endDate: string
): Promise<Array<{ id: string; name: string; color: string; income: number }>> {
  const transactions = await getTransactionsFiltered({
    startDate,
    endDate,
    showExcluded: false,
  });

  const categoryTotals: Map<string, { id: string; name: string; color: string; income: number }> = new Map();

  for (const t of transactions) {
    if (t.amount > 0 && t.category?.type === "income") {
      const existing = categoryTotals.get(t.category.id);
      if (existing) {
        existing.income += t.amount;
      } else {
        categoryTotals.set(t.category.id, {
          id: t.category.id,
          name: t.category.name,
          color: t.category.color,
          income: t.amount,
        });
      }
    }
  }

  return Array.from(categoryTotals.values()).sort((a, b) => b.income - a.income);
}

export async function getYearToDateIncome(year: number): Promise<number> {
  const startDate = `${year}-01-01`;
  const today = new Date();
  const endDate = today.getFullYear() === year
    ? today.toISOString().split("T")[0]
    : `${year}-12-31`;

  const response = await apiGet<ApiResponse<{ income: number }>>(
    `/api/transactions/stats?startDate=${startDate}&endDate=${endDate}&stat=income`
  );
  return response.data?.income ?? 0;
}

export async function getYearToDateCategoryIncome(
  year: number
): Promise<Array<{ id: string; name: string; color: string; income: number }>> {
  const currentMonth = new Date().getMonth() + 1;
  const months = Array.from({ length: currentMonth }, (_, i) => i + 1);

  const monthlyData = await Promise.all(
    months.map((m) => {
      const { startDate, endDate } = getMonthDateRange(year, m);
      return getIncomeByCategory(startDate, endDate);
    })
  );

  const categoryTotals: Map<string, { id: string; name: string; color: string; income: number }> = new Map();
  for (const monthData of monthlyData) {
    for (const cat of monthData) {
      const existing = categoryTotals.get(cat.id);
      if (existing) {
        existing.income += cat.income;
      } else {
        categoryTotals.set(cat.id, { ...cat });
      }
    }
  }

  return Array.from(categoryTotals.values()).sort((a, b) => b.income - a.income);
}

export async function getMonthlyIncome(
  year: number
): Promise<Array<{ month: number; monthStr: string; amount: number }>> {
  const currentMonth = new Date().getMonth() + 1;
  const months = Array.from({ length: currentMonth }, (_, i) => i + 1);

  const amounts = await Promise.all(
    months.map((m) => {
      const { startDate, endDate } = getMonthDateRange(year, m);
      return getTotalIncome(startDate, endDate);
    })
  );

  return months.map((month, i) => ({
    month,
    monthStr: `${year}-${String(month).padStart(2, "0")}`,
    amount: amounts[i],
  }));
}

// ============ Mutations ============

export async function createTransaction(input: CreateTransactionInput): Promise<string> {
  const response = await apiPost<ApiResponse<{ count: number }>>("/api/transactions", input);
  // The API returns count, but for single transaction we need the ID
  // For now return empty string - the hooks will invalidate and refetch
  return "";
}

export async function createManyTransactions(inputs: CreateTransactionInput[]): Promise<string[]> {
  await apiPost<ApiResponse<{ count: number }>>("/api/transactions", inputs);
  // Return empty array - the hooks will invalidate and refetch
  return [];
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryId: string | null,
  isConfirmed: boolean = true
): Promise<void> {
  await apiPatch<ApiResponse<TransactionWithRelations>>(`/api/transactions/${transactionId}`, {
    categoryId,
    isConfirmed,
  });
}

export async function confirmTransaction(
  transactionId: string,
  categoryId: string
): Promise<{ autoTaggedCount: number }> {
  const response = await apiPost<ApiResponse<{ autoTaggedCount: number }>>(
    `/api/transactions/${transactionId}/confirm`,
    { categoryId }
  );
  return { autoTaggedCount: response.data?.autoTaggedCount ?? 0 };
}

export async function toggleTransactionExcluded(transactionId: string): Promise<void> {
  await apiPost<ApiResponse<TransactionWithRelations>>(
    `/api/transactions/${transactionId}/toggle-excluded`
  );
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/api/transactions/${transactionId}`);
}

export async function uncategorizeTransaction(transactionId: string): Promise<void> {
  await apiPatch<ApiResponse<TransactionWithRelations>>(`/api/transactions/${transactionId}`, {
    categoryId: null,
    isConfirmed: false,
  });
}

// ============ Helpers ============

/**
 * Extract a short, general merchant pattern from a transaction description.
 * This is a pure function - no API call needed.
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
