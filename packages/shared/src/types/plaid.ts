/**
 * Plaid-related type definitions.
 */

import type { AccountType } from "./primitives";

/**
 * Account info returned from Plaid for creating local accounts.
 */
export interface PlaidAccountInfo {
  plaidAccountId: string;
  name: string;
  type: AccountType;
}

/**
 * An account within a Plaid item (institution connection).
 */
export interface PlaidItemAccount {
  id: string;
  plaidAccountId: string;
  name: string;
  type: AccountType;
}

/**
 * A connected Plaid institution with its accounts.
 */
export interface PlaidItemWithAccounts {
  id: string;
  institutionId: string;
  institutionName: string;
  lastSyncedAt: string | null;
  accounts: PlaidItemAccount[];
}
