import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Paths, File, Directory } from "expo-file-system";
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { decrypt, encrypt } from "@somar/shared";
import { DatabaseContext, type DatabaseContextValue } from "@somar/shared/hooks";
import { ExpoSqliteAdapter } from "../lib/storage/expo-sqlite-adapter";
import { fetchWithAuth } from "../lib/api";

// Auto-save debounce time in milliseconds
const AUTO_SAVE_DELAY = 3000;

// Database file path
const DB_FILENAME = "somar.db";

interface DatabaseProviderProps {
  children: ReactNode;
  encryptionKey: string; // Hex-encoded 256-bit key
}

type SaveDatabaseResult =
  | { ok: true; version: number }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; error: string };

/**
 * Encrypt and upload database to server.
 * Returns a result object instead of throwing.
 */
async function saveDatabase(
  dbFile: File,
  encryptionKey: string,
  expectedVersion: number
): Promise<SaveDatabaseResult> {
  // Read database file as ArrayBuffer
  const data = await dbFile.arrayBuffer();

  // Encrypt (pass expo-crypto's getRandomBytes for React Native)
  const encrypted = await encrypt(
    new Uint8Array(data),
    encryptionKey,
    Crypto.getRandomBytes
  );

  // Upload to server (convert to plain ArrayBuffer for fetch)
  const encryptedCopy = new Uint8Array(encrypted);
  const response = await fetchWithAuth("/api/db/upload", {
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
    return {
      ok: false,
      conflict: false,
      error: errorData.message || "Failed to save database",
    };
  }

  const result = await response.json();
  return { ok: true, version: parseInt(result.version, 10) };
}

/**
 * Provides a client-side SQLite database using expo-sqlite.
 *
 * On mount:
 * 1. Downloads encrypted blob from server
 * 2. Decrypts using provided key
 * 3. Writes to local file and opens with expo-sqlite
 *
 * On changes:
 * 1. Auto-saves after debounce delay
 * 2. Reads file, encrypts, uploads to server
 */
export function DatabaseProvider({
  children,
  encryptionKey,
}: DatabaseProviderProps) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [adapter, setAdapter] = useState<ExpoSqliteAdapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);
  const [hasConflict, setHasConflict] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const versionRef = useRef(0);
  const dbFileRef = useRef<File | null>(null);

  // Initialize database on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Ensure SQLite directory exists
        const sqliteDir = new Directory(Paths.document, "SQLite");
        if (!sqliteDir.exists) {
          sqliteDir.create();
        }

        // Create file reference
        const dbFile = new File(sqliteDir, DB_FILENAME);
        dbFileRef.current = dbFile;

        // Try to download existing database
        const response = await fetchWithAuth("/api/db/download");

        let initialVersion = 0;

        if (response.ok) {
          // Decrypt and write to file
          const encryptedBlob = await response.arrayBuffer();

          let decrypted: Uint8Array;
          try {
            decrypted = await decrypt(new Uint8Array(encryptedBlob), encryptionKey);
          } catch (decryptError) {
            throw new Error(
              "Failed to decrypt database. This may indicate an incorrect password or corrupted data."
            );
          }

          // Write decrypted database to file
          dbFile.write(decrypted);

          // Read version from response header
          const versionHeader = response.headers.get("X-Database-Version");
          initialVersion = versionHeader ? parseInt(versionHeader, 10) : 1;
        } else if (response.status === 404) {
          // New user - fetch initial database from server
          const initResponse = await fetchWithAuth("/api/db/init", {
            method: "POST",
          });

          if (!initResponse.ok) {
            if (initResponse.status === 409) {
              // Retry download - database was created by another device
              const retryResponse = await fetchWithAuth("/api/db/download");
              if (retryResponse.ok) {
                const encryptedBlob = await retryResponse.arrayBuffer();
                const decrypted = await decrypt(
                  new Uint8Array(encryptedBlob),
                  encryptionKey
                );
                dbFile.write(decrypted);
                const versionHeader = retryResponse.headers.get("X-Database-Version");
                initialVersion = versionHeader ? parseInt(versionHeader, 10) : 1;
              } else {
                throw new Error("Failed to download database after init conflict");
              }
            } else {
              throw new Error(`Failed to initialize database: ${initResponse.status}`);
            }
          } else {
            // Got fresh database from server - write to file
            const rawDbBytes = await initResponse.arrayBuffer();
            dbFile.write(new Uint8Array(rawDbBytes));

            // Encrypt and upload immediately
            if (mounted) {
              const result = await saveDatabase(dbFile, encryptionKey, 0);
              if (result.ok) {
                initialVersion = result.version;
              } else {
                throw new Error(
                  result.conflict ? "Version conflict during init" : result.error
                );
              }
            }
          }
        } else {
          throw new Error(`Failed to download database: ${response.status}`);
        }

        // Open database with expo-sqlite
        const database = await SQLite.openDatabaseAsync(DB_FILENAME);

        if (mounted) {
          setDb(database);
          setAdapter(new ExpoSqliteAdapter(database));
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
    if (!db || !dbFileRef.current) return;

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
      const result = await saveDatabase(dbFileRef.current, encryptionKey, versionRef.current);

      if (result.ok) {
        versionRef.current = result.version;
        setVersion(result.version);
      } else if (result.conflict) {
        setHasConflict(true);
        pendingSaveRef.current = false;
      } else {
        console.error("[DB] Save error:", result.error);
      }
    } catch (err) {
      console.error("[DB] Save error:", err);
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        save();
      }
    }
  }, [db, encryptionKey]);

  // Schedule auto-save
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, AUTO_SAVE_DELAY);
  }, [save]);

  // Run VACUUM to reclaim disk space
  const vacuum = useCallback(() => {
    if (!db) throw new Error("Database not ready");
    db.runSync("VACUUM");
    scheduleAutoSave();
  }, [db, scheduleAutoSave]);

  // Context value for shared hooks
  const contextValue: DatabaseContextValue = {
    adapter,
    isLoading,
    isReady: !!adapter && !isLoading && !error,
    error,
    version,
    save,
    vacuum,
  };

  // TODO: Add conflict modal UI similar to web
  if (hasConflict) {
    // For now, just log - in a real app, show a modal to reload
    console.warn("[DB] Version conflict detected - data out of sync");
  }

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}
