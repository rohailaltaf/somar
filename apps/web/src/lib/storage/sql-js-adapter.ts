/**
 * SqlJsAdapter - Implements DatabaseAdapter for sql.js
 *
 * This adapter wraps sql.js's Database object to provide the
 * platform-agnostic DatabaseAdapter interface used by shared services.
 */

import type { Database } from "sql.js";
import type { DatabaseAdapter, SqlParam } from "@somar/shared";

/**
 * Adapter that wraps a sql.js Database to implement DatabaseAdapter.
 */
export class SqlJsAdapter implements DatabaseAdapter {
  constructor(private db: Database) {}

  /**
   * Execute a query and return all rows as typed objects.
   */
  all<T>(sql: string, params?: SqlParam[]): T[] {
    const stmt = this.db.prepare(sql);
    if (params) {
      stmt.bind(params as (string | number | null | Uint8Array)[]);
    }

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

  /**
   * Execute a query and return the first row as a typed object.
   */
  get<T>(sql: string, params?: SqlParam[]): T | undefined {
    const stmt = this.db.prepare(sql);
    if (params) {
      stmt.bind(params as (string | number | null | Uint8Array)[]);
    }

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

  /**
   * Execute a mutation statement (INSERT/UPDATE/DELETE).
   */
  run(sql: string, params?: SqlParam[]): void {
    this.db.run(sql, params as (string | number | null | Uint8Array)[] | undefined);
  }

  /**
   * Execute raw SQL statements.
   */
  exec(sql: string): void {
    this.db.exec(sql);
  }

  /**
   * Get the underlying sql.js Database object.
   * Useful for operations not covered by the adapter interface
   * (e.g., export, close).
   */
  getRawDatabase(): Database {
    return this.db;
  }
}
