"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Database, BindParams } from "sql.js";
import { decrypt, encrypt } from "@somar/shared";

// Auto-save debounce time in milliseconds
const AUTO_SAVE_DELAY = 3000;

interface DatabaseContextValue {
  db: Database | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
  version: number;

  // Query helpers
  exec: (sql: string, params?: BindParams) => unknown[][];
  run: (sql: string, params?: BindParams) => void;
  get: <T>(sql: string, params?: BindParams) => T | undefined;
  all: <T>(sql: string, params?: BindParams) => T[];

  // Manual save (auto-save also runs)
  save: () => Promise<void>;

  // Run VACUUM to reclaim space after deleting many rows
  vacuum: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
  encryptionKey: string; // Hex-encoded 256-bit key
}

/**
 * Provides a client-side SQLite database that runs entirely in the browser.
 *
 * On mount:
 * 1. Downloads encrypted blob from server
 * 2. Decrypts using provided key
 * 3. Loads into sql.js (SQLite in WASM)
 *
 * On changes:
 * 1. Auto-saves after debounce delay
 * 2. Encrypts database
 * 3. Uploads to server
 */
export function DatabaseProvider({
  children,
  encryptionKey,
}: DatabaseProviderProps) {
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // Initialize database on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Dynamically import sql.js to avoid SSR bundling issues
        const initSqlJs = (await import("sql.js")).default;

        // Initialize sql.js with WASM
        const SQL = await initSqlJs({
          locateFile: (file) => `https://sql.js.org/dist/${file}`,
        });

        // Try to download existing database
        const response = await fetch("/api/db/download");

        let database: Database;
        let initialVersion = 0;

        if (response.ok) {
          // Decrypt and load existing database
          const encryptedBlob = await response.arrayBuffer();

          let decrypted: ArrayBuffer;
          try {
            decrypted = await decrypt(new Uint8Array(encryptedBlob), encryptionKey);
          } catch (decryptError) {
            throw new Error(
              "Failed to decrypt database. This may indicate an incorrect password or corrupted data."
            );
          }

          // Validate decrypted data is a valid SQLite database
          try {
            database = new SQL.Database(new Uint8Array(decrypted));
            // Verify it's a valid database by running a simple query
            database.exec("SELECT 1");
          } catch (dbError) {
            throw new Error(
              "Decrypted data is not a valid database. The encryption key may be incorrect."
            );
          }

          // Read version from response header for optimistic locking
          const versionHeader = response.headers.get("X-Database-Version");
          initialVersion = versionHeader ? parseInt(versionHeader, 10) : 1;
        } else if (response.status === 404) {
          // New user - create empty database with schema
          database = new SQL.Database();
          await initializeSchema(database);

          // Save immediately so server has a copy
          if (mounted) {
            const newVersion = await saveDatabase(database, encryptionKey, 0);
            initialVersion = newVersion;
          }
        } else {
          throw new Error(`Failed to download database: ${response.status}`);
        }

        if (mounted) {
          setDb(database);
          setVersion(initialVersion);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[DB] Initialization error:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [encryptionKey]);

  // Save database to server
  const save = useCallback(async () => {
    if (!db) return;
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;
    try {
      const newVersion = await saveDatabase(db, encryptionKey, version);
      setVersion(newVersion);
      console.log(`[DB] Saved to server (version ${newVersion})`);
    } catch (err) {
      console.error("[DB] Save error:", err);
      // Don't throw - auto-save should be silent
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        save(); // Retry pending save
      }
    }
  }, [db, encryptionKey, version]);

  // Schedule auto-save
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, AUTO_SAVE_DELAY);
  }, [save]);

  // Execute SQL and return results (for SELECT)
  const exec = useCallback(
    (sql: string, params?: BindParams) => {
      if (!db) throw new Error("Database not ready");
      const stmt = db.prepare(sql);
      if (params) stmt.bind(params);
      const results: unknown[][] = [];
      while (stmt.step()) {
        results.push(stmt.get());
      }
      stmt.free();
      return results;
    },
    [db]
  );

  // Run SQL without returning results (for INSERT/UPDATE/DELETE)
  const run = useCallback(
    (sql: string, params?: BindParams) => {
      if (!db) throw new Error("Database not ready");
      db.run(sql, params);
      scheduleAutoSave();
    },
    [db, scheduleAutoSave]
  );

  // Get single row as object
  const get = useCallback(
    <T,>(sql: string, params?: BindParams): T | undefined => {
      if (!db) throw new Error("Database not ready");
      const stmt = db.prepare(sql);
      if (params) stmt.bind(params);
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
    },
    [db]
  );

  // Get all rows as array of objects
  const all = useCallback(
    <T,>(sql: string, params?: BindParams): T[] => {
      if (!db) throw new Error("Database not ready");
      const stmt = db.prepare(sql);
      if (params) stmt.bind(params);
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
    },
    [db]
  );

  // Run VACUUM to reclaim disk space after deletions
  const vacuum = useCallback(async () => {
    if (!db) throw new Error("Database not ready");
    console.log("[DB] Running VACUUM to reclaim space...");
    db.run("VACUUM");
    await save();
    console.log("[DB] VACUUM complete, database saved");
  }, [db, save]);

  const value: DatabaseContextValue = {
    db,
    isLoading,
    error,
    isReady: !!db && !isLoading && !error,
    version,
    exec,
    run,
    get,
    all,
    save,
    vacuum,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

// Stable fallback for when database context is not available
// Defined outside the hook to prevent new object creation on every render
const DATABASE_NOT_AVAILABLE: DatabaseContextValue = {
  db: null,
  isLoading: true,
  error: null,
  isReady: false,
  version: 0,
  exec: () => { throw new Error("Database not available"); },
  run: () => { throw new Error("Database not available"); },
  get: () => undefined,
  all: () => [],
  save: async () => {},
  vacuum: async () => {},
};

/**
 * Hook to access the client-side database.
 */
export function useDatabase() {
  const context = useContext(DatabaseContext);
  
  // Return a stable "not ready" state when context is unavailable (SSR or unauthenticated)
  if (!context) {
    return DATABASE_NOT_AVAILABLE;
  }
  
  return context;
}

/**
 * Initialize empty database with schema.
 * Creates all tables and seeds default categories.
 */
async function initializeSchema(db: Database) {
  db.run(`
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
  `);

  // Seed default categories
  const defaultCategories = [
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

  const now = new Date().toISOString();
  for (const cat of defaultCategories) {
    db.run(
      "INSERT OR IGNORE INTO categories (id, name, type, color, created_at) VALUES (?, ?, ?, ?, ?)",
      [crypto.randomUUID(), cat.name, cat.type, cat.color, now]
    );
  }
}

/**
 * Encrypt and upload database to server.
 */
async function saveDatabase(
  db: Database,
  encryptionKey: string,
  expectedVersion: number
): Promise<number> {
  // Export database to bytes
  const data = db.export();

  // Encrypt
  const encrypted = await encrypt(data, encryptionKey);

  // Upload to server - copy to new ArrayBuffer to avoid SharedArrayBuffer type issues
  const encryptedCopy = new Uint8Array(encrypted);
  const response = await fetch("/api/db/upload", {
    method: "POST",
    body: encryptedCopy.buffer as ArrayBuffer,
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Expected-Version": expectedVersion.toString(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to save database");
  }

  const result = await response.json();
  return result.version;
}

