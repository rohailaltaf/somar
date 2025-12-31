/**
 * Account type definitions.
 */

import type { AccountType } from "./primitives";

/**
 * A financial account (checking, credit card, investment, or loan).
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
  plaidItemId: string | null;
  plaidAccountId: string | null;
}

/**
 * Input for creating a new account.
 */
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  plaidAccountId?: string | null;
}
