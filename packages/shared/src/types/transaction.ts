/**
 * Transaction type definitions.
 */

import type { Account } from "./account";
import type { Category } from "./category";

/**
 * A financial transaction.
 */
export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  date: string;
  excluded: boolean;
  isConfirmed: boolean;
  createdAt: string;
  plaidTransactionId: string | null;
  plaidAuthorizedDate: string | null;
  plaidPostedDate: string | null;
  plaidMerchantName: string | null;
}

/**
 * A transaction with its related account and category data.
 */
export interface TransactionWithRelations extends Transaction {
  category: Category | null;
  account: Account;
}

/**
 * Input for creating a new transaction.
 */
export interface CreateTransactionInput {
  accountId: string;
  description: string;
  amount: number;
  date: string;
  categoryId?: string | null;
  plaidTransactionId?: string | null;
}
