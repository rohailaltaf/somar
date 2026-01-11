/**
 * Serialization helpers for API responses.
 * Converts Prisma DateTime fields to YYYY-MM-DD strings for the API contract.
 */

import { toDateString, toDateStringNullable } from "@somar/shared/utils";

/**
 * Serialize a transaction for API response - converts Date fields to YYYY-MM-DD strings.
 */
export function serializeTransaction<
  T extends {
    date: Date;
    plaidAuthorizedDate?: Date | null;
    plaidPostedDate?: Date | null;
  }
>(
  transaction: T
): Omit<T, "date" | "plaidAuthorizedDate" | "plaidPostedDate"> & {
  date: string;
  plaidAuthorizedDate: string | null;
  plaidPostedDate: string | null;
} {
  return {
    ...transaction,
    date: toDateString(transaction.date),
    plaidAuthorizedDate: toDateStringNullable(transaction.plaidAuthorizedDate),
    plaidPostedDate: toDateStringNullable(transaction.plaidPostedDate),
  };
}

/**
 * Serialize multiple transactions for API response.
 */
export function serializeTransactions<
  T extends {
    date: Date;
    plaidAuthorizedDate?: Date | null;
    plaidPostedDate?: Date | null;
  }
>(
  transactions: T[]
): (Omit<T, "date" | "plaidAuthorizedDate" | "plaidPostedDate"> & {
  date: string;
  plaidAuthorizedDate: string | null;
  plaidPostedDate: string | null;
})[] {
  return transactions.map(serializeTransaction);
}
