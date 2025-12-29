/**
 * E2E Integration tests for database initialization and version management.
 *
 * These tests verify the complete flow:
 * 1. New user gets initial database from /api/db/init
 * 2. Client encrypts and uploads via /api/db/upload
 * 3. Version management prevents conflicts
 * 4. Subsequent saves use correct version
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockStorage, mockStorage } from "../mocks/storage.mock";
import { mockSessionState, createMockSession } from "../mocks/session.mock";
import {
  TEST_USER_ID,
  createTestDatabase,
  encryptTestDatabase,
  getTestEncryptionKey,
} from "../helpers/test-db";

// Mock modules before importing route handlers
vi.mock("@/lib/storage", () => ({
  getStorage: () => mockStorage,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => mockSessionState.getSession()),
    },
  },
}));

// Mock Prisma with in-memory data
const mockEncryptedDatabases = new Map<
  string,
  { userId: string; version: bigint; sizeBytes: number }
>();

// Helper to clone a record (avoids reference mutation issues)
function cloneRecord(record: { userId: string; version: bigint; sizeBytes: number } | null) {
  if (!record) return null;
  return { ...record };
}

vi.mock("@/lib/db", () => ({
  db: {
    encryptedDatabase: {
      findUnique: vi.fn(async ({ where }: { where: { userId: string } }) => {
        return cloneRecord(mockEncryptedDatabases.get(where.userId) ?? null);
      }),
      create: vi.fn(
        async ({ data }: { data: { userId: string; version: number; sizeBytes: number } }) => {
          const record = {
            userId: data.userId,
            version: BigInt(data.version),
            sizeBytes: data.sizeBytes,
          };
          mockEncryptedDatabases.set(data.userId, record);
          return cloneRecord(record);
        }
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { userId: string; version: bigint };
          data: { version: bigint; sizeBytes: number; updatedAt: Date };
        }) => {
          const existing = mockEncryptedDatabases.get(where.userId);
          if (existing && existing.version === where.version) {
            existing.version = data.version;
            existing.sizeBytes = data.sizeBytes;
            return { count: 1 };
          }
          return { count: 0 };
        }
      ),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      // Execute transaction with the mock db
      const mockTx = {
        encryptedDatabase: {
          findUnique: async ({ where }: { where: { userId: string } }) => {
            // Return a COPY to avoid reference mutation issues
            return cloneRecord(mockEncryptedDatabases.get(where.userId) ?? null);
          },
          create: async ({
            data,
          }: {
            data: { userId: string; version: number; sizeBytes: number };
          }) => {
            const record = {
              userId: data.userId,
              version: BigInt(data.version),
              sizeBytes: data.sizeBytes,
            };
            mockEncryptedDatabases.set(data.userId, record);
            return cloneRecord(record);
          },
          updateMany: async ({
            where,
            data,
          }: {
            where: { userId: string; version: bigint };
            data: { version: bigint; sizeBytes: number; updatedAt: Date };
          }) => {
            const existing = mockEncryptedDatabases.get(where.userId);
            if (existing && existing.version === where.version) {
              existing.version = data.version;
              existing.sizeBytes = data.sizeBytes;
              return { count: 1 };
            }
            return { count: 0 };
          },
        },
      };
      return fn(mockTx);
    }),
  },
}));

// Import route handlers AFTER mocking
import { POST as initHandler } from "@/app/api/db/init/route";
import { POST as uploadHandler } from "@/app/api/db/upload/route";
import { GET as downloadHandler } from "@/app/api/db/download/route";

// Mock headers function
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

// Helper to generate unique user ID per test to avoid state collisions
let testCounter = 0;
function getUniqueUserId(): string {
  return `test-user-${++testCounter}-${Date.now()}`;
}

describe("Database Flow E2E", () => {
  let currentUserId: string;

  beforeEach(() => {
    // Reset all mocks and state
    mockStorage.reset();
    mockEncryptedDatabases.clear();
    // Use unique user ID per test to avoid any state leakage
    currentUserId = getUniqueUserId();
    mockSessionState.setTestUser(currentUserId);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("creates initial database for new user", async () => {
      // Call init endpoint
      const response = await initHandler();

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/octet-stream"
      );

      // Verify we got database bytes
      const bytes = await response.arrayBuffer();
      expect(bytes.byteLength).toBeGreaterThan(0);

      // Verify storage was NOT touched (init just returns bytes, doesn't store)
      expect(mockStorage.putCalls.length).toBe(0);
    });

    it("returns 409 if database already exists in storage", async () => {
      // Pre-populate storage with existing database
      const existingDb = Buffer.from("existing encrypted db");
      await mockStorage.put(`users/${currentUserId}.db.enc`, existingDb);

      // Call init endpoint
      const response = await initHandler();

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error).toContain("already exists");
    });

    it("returns 409 if metadata already exists", async () => {
      // Pre-populate metadata (but not storage)
      mockEncryptedDatabases.set(currentUserId, {
        userId: currentUserId,
        version: 1n,
        sizeBytes: 1000,
      });

      // Call init endpoint
      const response = await initHandler();

      expect(response.status).toBe(409);
    });

    it("returns 401 if not authenticated", async () => {
      // Clear session
      mockSessionState.clearSession();

      const response = await initHandler();

      expect(response.status).toBe(401);
    });
  });

  describe("Version Management", () => {
    it("increments version on successful upload", async () => {
      // First upload (version 0 -> 1)
      const db1 = createTestDatabase();
      const encrypted1 = await encryptTestDatabase(db1);

      const request1 = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: encrypted1,
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "0",
        },
      });

      const response1 = await uploadHandler(request1);
      expect(response1.status).toBe(200);

      const body1 = await response1.json();
      expect(body1.version).toBe("1");

      // Second upload (version 1 -> 2)
      const db2 = createTestDatabase();
      const encrypted2 = await encryptTestDatabase(db2);

      const request2 = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: encrypted2,
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "1",
        },
      });

      const response2 = await uploadHandler(request2);
      expect(response2.status).toBe(200);

      const body2 = await response2.json();
      expect(body2.version).toBe("2");
    });

    it("rejects stale version with 409 Conflict", async () => {
      // First, create a database at version 1
      const db1 = createTestDatabase();
      const encrypted1 = await encryptTestDatabase(db1);

      const request1 = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: encrypted1,
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "0",
        },
      });

      await uploadHandler(request1);

      // Now try to upload with stale version (0 instead of 1)
      const db2 = createTestDatabase();
      const encrypted2 = await encryptTestDatabase(db2);

      const request2 = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: encrypted2,
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "0", // Stale!
        },
      });

      const response2 = await uploadHandler(request2);
      expect(response2.status).toBe(409);

      const body2 = await response2.json();
      expect(body2.error).toBe("conflict");
      expect(body2.serverVersion).toBe("1");
    });

    it("returns correct serverVersion in conflict response", async () => {
      // Create database at version 3
      mockEncryptedDatabases.set(currentUserId, {
        userId: currentUserId,
        version: 3n,
        sizeBytes: 1000,
      });
      await mockStorage.put(
        `users/${currentUserId}.db.enc`,
        Buffer.from("existing")
      );

      // Try to upload with version 1 (way behind)
      const db = createTestDatabase();
      const encrypted = await encryptTestDatabase(db);

      const request = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: encrypted,
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "1",
        },
      });

      const response = await uploadHandler(request);
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.serverVersion).toBe("3");
    });
  });

  describe("Save After Init", () => {
    it("uses correct version immediately after init", async () => {
      // This tests the race condition we fixed with versionRef:
      // 1. Init returns raw DB
      // 2. Client encrypts and uploads with expectedVersion=0
      // 3. Server returns version=1
      // 4. Immediately save again (simulating mutation)
      // 5. Should use expectedVersion=1, NOT stale 0

      // Step 1: Get initial database
      const initResponse = await initHandler();
      expect(initResponse.status).toBe(200);

      // Step 2: Encrypt and upload with version 0
      const rawDb = Buffer.from(await initResponse.arrayBuffer());
      const key = await getTestEncryptionKey();
      const { encrypt } = await import("@somar/shared");
      const encrypted1 = await encrypt(new Uint8Array(rawDb), key);

      const uploadRequest1 = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: new Uint8Array(encrypted1),
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "0",
        },
      });

      const uploadResponse1 = await uploadHandler(uploadRequest1);
      expect(uploadResponse1.status).toBe(200);

      const body1 = await uploadResponse1.json();
      expect(body1.version).toBe("1");

      // Step 3: Immediately upload again with correct version
      // (simulating mutation triggering immediate save)
      const encrypted2 = await encrypt(new Uint8Array(rawDb), key);

      const uploadRequest2 = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: new Uint8Array(encrypted2),
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "1", // Must be 1, not 0!
        },
      });

      const uploadResponse2 = await uploadHandler(uploadRequest2);
      expect(uploadResponse2.status).toBe(200);

      const body2 = await uploadResponse2.json();
      expect(body2.version).toBe("2");
    });

    it("fails if stale version is used after init", async () => {
      // This shows what WOULD happen without the versionRef fix

      // Get initial database
      const initResponse = await initHandler();
      const rawDb = Buffer.from(await initResponse.arrayBuffer());
      const key = await getTestEncryptionKey();
      const { encrypt } = await import("@somar/shared");

      // First upload - version 0 -> 1
      const encrypted1 = await encrypt(new Uint8Array(rawDb), key);
      const uploadRequest1 = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: new Uint8Array(encrypted1),
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "0",
        },
      });

      await uploadHandler(uploadRequest1);

      // Second upload with STALE version (simulating the bug)
      const encrypted2 = await encrypt(new Uint8Array(rawDb), key);
      const uploadRequest2 = new Request("http://localhost/api/db/upload", {
        method: "POST",
        body: new Uint8Array(encrypted2),
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Expected-Version": "0", // WRONG - should be 1
        },
      });

      const uploadResponse2 = await uploadHandler(uploadRequest2);
      expect(uploadResponse2.status).toBe(409); // Conflict!
    });
  });

  describe("Download", () => {
    it("returns 404 for new user without database", async () => {
      const response = await downloadHandler();

      expect(response.status).toBe(404);
    });

    it("returns encrypted database with version header", async () => {
      // Create a database first
      const db = createTestDatabase();
      const encrypted = await encryptTestDatabase(db);
      await mockStorage.put(
        `users/${currentUserId}.db.enc`,
        Buffer.from(encrypted)
      );
      mockEncryptedDatabases.set(currentUserId, {
        userId: currentUserId,
        version: 5n,
        sizeBytes: encrypted.length,
      });

      const response = await downloadHandler();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Database-Version")).toBe("5");
      expect(response.headers.get("Content-Type")).toBe(
        "application/octet-stream"
      );

      const bytes = await response.arrayBuffer();
      expect(bytes.byteLength).toBe(encrypted.length);
    });
  });
});
