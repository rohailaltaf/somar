/**
 * Test utilities for database operations.
 * Provides helpers for creating test databases and encryption.
 */

import { encrypt, decrypt, deriveEncryptionKey } from "@somar/shared";
import { createInitialDatabase } from "@/lib/sqlite-server";

// Test constants
export const TEST_USER_ID = "test-user-123";
export const TEST_PASSWORD = "test-password-123";
export const TEST_SALT = "test-salt-abcdef123456";

/**
 * Derives a test encryption key from password and salt.
 */
export async function getTestEncryptionKey(): Promise<string> {
  return deriveEncryptionKey(TEST_PASSWORD, TEST_SALT);
}

/**
 * Creates a fresh initial database (same as /api/db/init).
 */
export function createTestDatabase(): Buffer {
  return createInitialDatabase();
}

/**
 * Encrypts database bytes with the test encryption key.
 */
export async function encryptTestDatabase(
  dbBytes: Buffer | Uint8Array
): Promise<Uint8Array> {
  const key = await getTestEncryptionKey();
  return encrypt(new Uint8Array(dbBytes), key);
}

/**
 * Decrypts database bytes with the test encryption key.
 */
export async function decryptTestDatabase(
  encryptedBytes: Uint8Array
): Promise<Uint8Array> {
  const key = await getTestEncryptionKey();
  return decrypt(encryptedBytes, key);
}

/**
 * Creates and encrypts a test database in one step.
 */
export async function createEncryptedTestDatabase(): Promise<{
  rawDb: Buffer;
  encryptedDb: Uint8Array;
  encryptionKey: string;
}> {
  const rawDb = createTestDatabase();
  const encryptionKey = await getTestEncryptionKey();
  const encryptedDb = await encrypt(new Uint8Array(rawDb), encryptionKey);
  return { rawDb, encryptedDb, encryptionKey };
}
