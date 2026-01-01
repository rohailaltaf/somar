"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Database } from "sql.js";
import { decrypt, encrypt } from "@somar/shared";
import { DatabaseContext, type DatabaseContextValue } from "@somar/shared/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { SqlJsAdapter } from "@/lib/storage/sql-js-adapter";

// Auto-save debounce time in milliseconds
const AUTO_SAVE_DELAY = 3000;

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
  const [adapter, setAdapter] = useState<SqlJsAdapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);
  const [hasConflict, setHasConflict] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  // Use ref to track version synchronously (avoids stale closure in save callback)
  const versionRef = useRef(0);

  // Initialize database on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Dynamically import sql.js to avoid SSR bundling issues
        const initSqlJs = (await import("sql.js")).default;

        // Initialize sql.js with WASM (self-hosted to avoid CDN availability/supply chain risks)
        const SQL = await initSqlJs({
          locateFile: (file) => `/${file}`,
        });

        // Try to download existing database
        const response = await fetch("/api/db/download");

        let database: Database;
        let initialVersion = 0;

        if (response.ok) {
          // Decrypt and load existing database
          const encryptedBlob = await response.arrayBuffer();

          let decrypted: Uint8Array;
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
          // New user - fetch initial database from server
          const initResponse = await fetch("/api/db/init", { method: "POST" });

          if (!initResponse.ok) {
            // Handle 409 conflict (database was created between checks)
            if (initResponse.status === 409) {
              // Retry download - database was created by another tab/request
              const retryResponse = await fetch("/api/db/download");
              if (retryResponse.ok) {
                const encryptedBlob = await retryResponse.arrayBuffer();
                const decrypted = await decrypt(
                  new Uint8Array(encryptedBlob),
                  encryptionKey
                );
                database = new SQL.Database(new Uint8Array(decrypted));
                const versionHeader =
                  retryResponse.headers.get("X-Database-Version");
                initialVersion = versionHeader ? parseInt(versionHeader, 10) : 1;
              } else {
                throw new Error(
                  `Failed to download database after init conflict`
                );
              }
            } else {
              throw new Error(
                `Failed to initialize database: ${initResponse.status}`
              );
            }
          } else {
            // Got fresh database from server - load it
            const rawDbBytes = await initResponse.arrayBuffer();
            database = new SQL.Database(new Uint8Array(rawDbBytes));

            // Encrypt and upload immediately
            if (mounted) {
              const result = await saveDatabase(
                database,
                encryptionKey,
                0
              );
              if (result.ok) {
                initialVersion = result.version;
              } else {
                throw new Error(result.conflict ? "Version conflict during init" : result.error);
              }
            }
          }
        } else {
          throw new Error(`Failed to download database: ${response.status}`);
        }

        if (mounted) {
          setDb(database);
          setAdapter(new SqlJsAdapter(database));
          versionRef.current = initialVersion;
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

    // Clear any pending auto-save since we're saving now
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;
    try {
      // Use ref for version to avoid stale closure issues
      const result = await saveDatabase(db, encryptionKey, versionRef.current);

      if (result.ok) {
        versionRef.current = result.version;
        setVersion(result.version);
      } else if (result.conflict) {
        // Version conflict - show modal, don't retry
        setHasConflict(true);
        pendingSaveRef.current = false;
      } else {
        // Other error - log it
        console.error("[DB] Save error:", result.error);
      }
    } catch (err) {
      // Unexpected error (network failure, encryption error, etc.)
      console.error("[DB] Save error:", err);
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        save(); // Retry pending save
      }
    }
  }, [db, encryptionKey]);

  // Run VACUUM to reclaim disk space after deletions
  const vacuum = useCallback(() => {
    if (!db) throw new Error("Database not ready");
    db.run("VACUUM");
    // Schedule auto-save after vacuum
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, AUTO_SAVE_DELAY);
  }, [db, save]);

  // Context value for shared hooks (uses DatabaseAdapter interface)
  const contextValue: DatabaseContextValue = {
    adapter,
    isLoading,
    isReady: !!adapter && !isLoading && !error,
    error,
    version,
    save,
    vacuum,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}

      {/* Version conflict modal - shown when another tab updated the database */}
      <Dialog open={hasConflict}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Data Out of Sync</DialogTitle>
            <DialogDescription>
              Your data was updated in another tab or device. Please refresh to
              get the latest version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DatabaseContext.Provider>
  );
}

type SaveDatabaseResult =
  | { ok: true; version: number }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; error: string };

/**
 * Encrypt and upload database to server.
 * Returns a result object instead of throwing to avoid Next.js dev overlay issues.
 */
async function saveDatabase(
  db: Database,
  encryptionKey: string,
  expectedVersion: number
): Promise<SaveDatabaseResult> {
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
    const errorData = await response.json();
    if (errorData.error === "conflict") {
      return { ok: false, conflict: true };
    }
    return { ok: false, conflict: false, error: errorData.message || "Failed to save database" };
  }

  const result = await response.json();
  return { ok: true, version: parseInt(result.version, 10) };
}
