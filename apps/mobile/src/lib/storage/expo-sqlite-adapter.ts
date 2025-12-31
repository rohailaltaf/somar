/**
 * ExpoSqliteAdapter - Implements DatabaseAdapter for expo-sqlite
 *
 * This adapter wraps expo-sqlite's SQLiteDatabase object to provide the
 * platform-agnostic DatabaseAdapter interface used by shared services.
 */

import type { SQLiteDatabase } from "expo-sqlite";
import type { DatabaseAdapter, SqlParam } from "@somar/shared";

/**
 * Adapter that wraps an expo-sqlite Database to implement DatabaseAdapter.
 */
export class ExpoSqliteAdapter implements DatabaseAdapter {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Execute a query and return all rows as typed objects.
   */
  all<T>(sql: string, params?: SqlParam[]): T[] {
    return this.db.getAllSync<T>(sql, params ?? []);
  }

  /**
   * Execute a query and return the first row as a typed object.
   */
  get<T>(sql: string, params?: SqlParam[]): T | undefined {
    const result = this.db.getFirstSync<T>(sql, params ?? []);
    return result ?? undefined;
  }

  /**
   * Execute a mutation statement (INSERT/UPDATE/DELETE).
   */
  run(sql: string, params?: SqlParam[]): void {
    this.db.runSync(sql, params ?? []);
  }

  /**
   * Execute raw SQL statements.
   */
  exec(sql: string): void {
    this.db.execSync(sql);
  }

  /**
   * Get the underlying expo-sqlite Database object.
   * Useful for operations not covered by the adapter interface.
   */
  getRawDatabase(): SQLiteDatabase {
    return this.db;
  }
}
