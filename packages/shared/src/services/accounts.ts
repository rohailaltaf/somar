/**
 * Account service - encapsulates all account-related database operations.
 * This is a pure data layer with NO React/UI dependencies.
 *
 * Uses DatabaseAdapter interface for platform-agnostic database access.
 */

import type { DatabaseAdapter } from "../storage";
import type { Account, AccountType, CreateAccountInput } from "../types";

// ============ Queries ============

export function getAllAccounts(db: DatabaseAdapter): Account[] {
  return db.all<RawAccount>(
    "SELECT * FROM accounts ORDER BY name"
  ).map(mapAccountRow);
}

export function getAccountById(db: DatabaseAdapter, id: string): Account | null {
  const row = db.get<RawAccount>(
    "SELECT * FROM accounts WHERE id = ?",
    [id]
  );
  return row ? mapAccountRow(row) : null;
}

export function getManualAccounts(db: DatabaseAdapter): Account[] {
  return db.all<RawAccount>(
    "SELECT * FROM accounts WHERE plaid_account_id IS NULL ORDER BY name"
  ).map(mapAccountRow);
}

export function getPlaidAccounts(db: DatabaseAdapter): Account[] {
  return db.all<RawAccount>(
    "SELECT * FROM accounts WHERE plaid_account_id IS NOT NULL ORDER BY name"
  ).map(mapAccountRow);
}

// ============ Mutations ============

export function createAccount(db: DatabaseAdapter, input: CreateAccountInput): string {
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO accounts (id, name, type, created_at, plaid_account_id)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.type, new Date().toISOString(), input.plaidAccountId ?? null]
  );
  return id;
}

export function updateAccount(
  db: DatabaseAdapter,
  id: string,
  name: string,
  type: AccountType,
  plaidAccountId?: string | null
): void {
  if (plaidAccountId !== undefined) {
    // Update including plaid_account_id (can be null to clear it)
    db.run(
      "UPDATE accounts SET name = ?, type = ?, plaid_account_id = ? WHERE id = ?",
      [name, type, plaidAccountId, id]
    );
  } else {
    // Only update name and type
    db.run(
      "UPDATE accounts SET name = ?, type = ? WHERE id = ?",
      [name, type, id]
    );
  }
}

export function deleteAccount(db: DatabaseAdapter, id: string): void {
  // First delete all transactions for this account
  db.run("DELETE FROM transactions WHERE account_id = ?", [id]);
  // Then delete the account
  db.run("DELETE FROM accounts WHERE id = ?", [id]);
}

// ============ Helpers ============

interface RawAccount {
  id: string;
  name: string;
  type: string;
  created_at: string;
  plaid_account_id: string | null;
}

function mapAccountRow(row: RawAccount): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as AccountType,
    createdAt: row.created_at,
    plaidItemId: null, // Plaid items are in central DB, not user's SQLite
    plaidAccountId: row.plaid_account_id,
  };
}
