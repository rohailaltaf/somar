/**
 * Account service - encapsulates all account-related database operations.
 * This is a pure data layer with NO React/UI dependencies.
 */

import type { Database } from "sql.js";
import type { AccountType } from "@somar/shared";

// Re-export shared types for convenience
export type { AccountType } from "@somar/shared";

// ============ Types ============

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
  plaidItemId: string | null;
  plaidAccountId: string | null;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  plaidAccountId?: string | null;
}

// ============ Queries ============

export function getAllAccounts(db: Database): Account[] {
  return queryAll<RawAccount>(
    db,
    "SELECT * FROM accounts ORDER BY name"
  ).map(mapAccountRow);
}

export function getAccountById(db: Database, id: string): Account | null {
  const row = queryOne<RawAccount>(
    db,
    "SELECT * FROM accounts WHERE id = ?",
    [id]
  );
  return row ? mapAccountRow(row) : null;
}

export function getManualAccounts(db: Database): Account[] {
  return queryAll<RawAccount>(
    db,
    "SELECT * FROM accounts WHERE plaid_account_id IS NULL ORDER BY name"
  ).map(mapAccountRow);
}

export function getPlaidAccounts(db: Database): Account[] {
  return queryAll<RawAccount>(
    db,
    "SELECT * FROM accounts WHERE plaid_account_id IS NOT NULL ORDER BY name"
  ).map(mapAccountRow);
}

// ============ Mutations ============

export function createAccount(db: Database, input: CreateAccountInput): string {
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO accounts (id, name, type, created_at, plaid_account_id)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.type, new Date().toISOString(), input.plaidAccountId ?? null]
  );
  return id;
}

export function updateAccount(
  db: Database,
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

export function deleteAccount(db: Database, id: string): void {
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

// ============ Database Query Helpers ============

type SqlParam = string | number | null | Uint8Array;

function queryOne<T>(db: Database, sql: string, params?: SqlParam[]): T | undefined {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as (string | number | null | Uint8Array)[]);
  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    const row: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    stmt.free();
    return row as T;
  }
  stmt.free();
  return undefined;
}

function queryAll<T>(db: Database, sql: string, params?: SqlParam[]): T[] {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as (string | number | null | Uint8Array)[]);
  const columns = stmt.getColumnNames();
  const results: T[] = [];
  while (stmt.step()) {
    const values = stmt.get();
    const row: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    results.push(row as T);
  }
  stmt.free();
  return results;
}

