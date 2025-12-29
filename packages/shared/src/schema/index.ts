// Schema definition for the client-side SQLite database
// Shared between web (sql.js) and server (better-sqlite3) for consistent initialization

/**
 * SQL schema DDL for the user's encrypted database.
 * Creates all tables and indexes for accounts, transactions, categories, etc.
 */
export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    plaid_account_id TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'spending',
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS category_budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    start_month TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_category_budgets_category_start
    ON category_budgets(category_id, start_month);

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    excluded INTEGER NOT NULL DEFAULT 0,
    is_confirmed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    plaid_transaction_id TEXT UNIQUE,
    plaid_original_description TEXT,
    plaid_name TEXT,
    plaid_merchant_name TEXT,
    plaid_authorized_date TEXT,
    plaid_posted_date TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_confirmed ON transactions(is_confirmed);

  CREATE TABLE IF NOT EXISTS categorization_rules (
    id TEXT PRIMARY KEY,
    pattern TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_preset INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rules_category ON categorization_rules(category_id);

  CREATE TABLE IF NOT EXISTS plaid_sync_state (
    item_id TEXT PRIMARY KEY,
    cursor TEXT NOT NULL,
    last_synced_at TEXT NOT NULL
  );
`;

/**
 * Default category definition.
 */
export interface DefaultCategory {
  name: string;
  type: "spending" | "income" | "transfer";
  color: string;
}

/**
 * Default categories seeded into every new database.
 */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "personal", type: "spending", color: "oklch(0.65 0.15 280)" },
  { name: "restaurant", type: "spending", color: "oklch(0.65 0.2 30)" },
  { name: "grocery", type: "spending", color: "oklch(0.65 0.18 140)" },
  { name: "shopping", type: "spending", color: "oklch(0.65 0.18 350)" },
  { name: "entertainment", type: "spending", color: "oklch(0.65 0.2 330)" },
  { name: "subscriptions", type: "spending", color: "oklch(0.6 0.15 300)" },
  { name: "travel", type: "spending", color: "oklch(0.6 0.18 200)" },
  { name: "car", type: "spending", color: "oklch(0.5 0.12 240)" },
  { name: "house", type: "spending", color: "oklch(0.6 0.12 80)" },
  { name: "work", type: "spending", color: "oklch(0.55 0.15 250)" },
  { name: "job income", type: "income", color: "oklch(0.7 0.2 140)" },
  { name: "transfers", type: "transfer", color: "oklch(0.5 0.08 220)" },
  { name: "credit card payments", type: "transfer", color: "oklch(0.5 0.08 200)" },
  { name: "reimbursed", type: "transfer", color: "oklch(0.7 0.15 150)" },
];
