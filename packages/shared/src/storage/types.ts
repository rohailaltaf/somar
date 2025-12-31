/**
 * Storage abstraction layer for database operations.
 * This interface is implemented by platform-specific adapters:
 * - Web: SqlJsAdapter (wraps sql.js Database)
 * - Mobile: ExpoSqliteAdapter (wraps expo-sqlite)
 */

/**
 * SQL parameter types supported by both sql.js and expo-sqlite.
 */
export type SqlParam = string | number | null | Uint8Array;

/**
 * Platform-agnostic database adapter interface.
 * Provides a common API for executing SQL queries across web and mobile.
 */
export interface DatabaseAdapter {
  /**
   * Execute a query and return all rows as typed objects.
   * @param sql - The SQL query string with ? placeholders
   * @param params - Optional array of parameter values
   * @returns Array of typed row objects
   */
  all<T>(sql: string, params?: SqlParam[]): T[];

  /**
   * Execute a query and return the first row as a typed object.
   * @param sql - The SQL query string with ? placeholders
   * @param params - Optional array of parameter values
   * @returns The first row as a typed object, or undefined if no rows
   */
  get<T>(sql: string, params?: SqlParam[]): T | undefined;

  /**
   * Execute a mutation statement (INSERT/UPDATE/DELETE).
   * Does not return results.
   * @param sql - The SQL statement with ? placeholders
   * @param params - Optional array of parameter values
   */
  run(sql: string, params?: SqlParam[]): void;

  /**
   * Execute raw SQL statements (for schema creation, etc.).
   * Can execute multiple statements separated by semicolons.
   * @param sql - Raw SQL string to execute
   */
  exec(sql: string): void;
}
