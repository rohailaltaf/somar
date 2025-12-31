"use client";

import { createContext, useContext } from "react";
import type { DatabaseAdapter } from "../storage";

/**
 * Context value provided by platform-specific DatabaseProviders.
 * Web and mobile each implement their own DatabaseProvider that
 * provides this context with their respective database adapter.
 */
export interface DatabaseContextValue {
  /** The database adapter (null while loading) */
  adapter: DatabaseAdapter | null;

  /** True while the database is being initialized */
  isLoading: boolean;

  /** True when the database is ready for queries */
  isReady: boolean;

  /** Current database version (for optimistic locking) */
  version: number;

  /** Persist changes to server */
  save: () => Promise<void>;

  /** Run VACUUM to reclaim disk space */
  vacuum: () => void;
}

/**
 * React context for the database adapter.
 * Platform-specific providers (Web/Mobile) supply this context.
 */
export const DatabaseContext = createContext<DatabaseContextValue | null>(null);

/**
 * Hook to access the database adapter from context.
 * Must be used within a DatabaseProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { adapter, isReady, save } = useDatabaseAdapter();
 *
 *   if (!isReady) return <Loading />;
 *
 *   const transactions = getAllTransactions(adapter!);
 *   // ...
 * }
 * ```
 */
export function useDatabaseAdapter(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error(
      "useDatabaseAdapter must be used within a DatabaseProvider. " +
      "Wrap your app with the platform-specific DatabaseProvider."
    );
  }
  return ctx;
}
