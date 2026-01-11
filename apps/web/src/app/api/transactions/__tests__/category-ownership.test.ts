/**
 * Category Ownership Validation Tests
 *
 * Verifies that transaction routes properly validate category ownership
 * before creating or updating transactions. This prevents users from
 * assigning transactions to categories owned by other users.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    financeAccount: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    transaction: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { POST } from "../route";
import { PATCH } from "../[id]/route";

const mockAuth = auth as unknown as {
  api: { getSession: ReturnType<typeof vi.fn> };
};
const mockDb = db as unknown as {
  financeAccount: { findMany: ReturnType<typeof vi.fn> };
  category: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
  transaction: {
    createMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe("Transaction Category Ownership Validation", () => {
  const mockUserId = "user-123";
  const mockOtherUserId = "other-user-456";
  const mockAccountId = "account-abc";
  const mockCategoryId = "category-xyz";
  const mockOtherUserCategoryId = "other-user-category-789";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: mockUserId },
    });
  });

  describe("POST /api/transactions - Create transactions", () => {
    it("should reject transaction with category owned by another user", async () => {
      // User's account exists
      mockDb.financeAccount.findMany.mockResolvedValue([
        { id: mockAccountId, userId: mockUserId },
      ]);

      // Category does NOT belong to user (returns empty array)
      mockDb.category.findMany.mockResolvedValue([]);

      const request = new Request("http://localhost/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          accountId: mockAccountId,
          categoryId: mockOtherUserCategoryId,
          description: "Test transaction",
          amount: -50,
          date: "2024-01-15",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_CATEGORY");
      expect(data.error.message).toBe("One or more categories not found");

      // Verify category ownership was checked
      expect(mockDb.category.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [mockOtherUserCategoryId] },
          userId: mockUserId,
        },
      });

      // Verify transaction was NOT created
      expect(mockDb.transaction.createMany).not.toHaveBeenCalled();
    });

    it("should allow transaction with category owned by the user", async () => {
      // User's account exists
      mockDb.financeAccount.findMany.mockResolvedValue([
        { id: mockAccountId, userId: mockUserId },
      ]);

      // Category belongs to user
      mockDb.category.findMany.mockResolvedValue([
        { id: mockCategoryId, userId: mockUserId },
      ]);

      // Transaction created successfully
      mockDb.transaction.createMany.mockResolvedValue({ count: 1 });

      const request = new Request("http://localhost/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          accountId: mockAccountId,
          categoryId: mockCategoryId,
          description: "Test transaction",
          amount: -50,
          date: "2024-01-15",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.count).toBe(1);

      // Verify transaction was created
      expect(mockDb.transaction.createMany).toHaveBeenCalled();
    });

    it("should allow transaction without categoryId (null)", async () => {
      // User's account exists
      mockDb.financeAccount.findMany.mockResolvedValue([
        { id: mockAccountId, userId: mockUserId },
      ]);

      // Transaction created successfully
      mockDb.transaction.createMany.mockResolvedValue({ count: 1 });

      const request = new Request("http://localhost/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          accountId: mockAccountId,
          // No categoryId
          description: "Uncategorized transaction",
          amount: -25,
          date: "2024-01-15",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);

      // Category validation should NOT have been called
      expect(mockDb.category.findMany).not.toHaveBeenCalled();
    });

    it("should reject batch when any transaction has invalid category", async () => {
      // User's accounts exist
      mockDb.financeAccount.findMany.mockResolvedValue([
        { id: mockAccountId, userId: mockUserId },
      ]);

      // Only one of two categories belongs to user
      mockDb.category.findMany.mockResolvedValue([
        { id: mockCategoryId, userId: mockUserId },
      ]);

      const request = new Request("http://localhost/api/transactions", {
        method: "POST",
        body: JSON.stringify([
          {
            accountId: mockAccountId,
            categoryId: mockCategoryId, // Valid
            description: "Transaction 1",
            amount: -50,
            date: "2024-01-15",
          },
          {
            accountId: mockAccountId,
            categoryId: mockOtherUserCategoryId, // Invalid - other user's
            description: "Transaction 2",
            amount: -75,
            date: "2024-01-16",
          },
        ]),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_CATEGORY");

      // No transactions should be created
      expect(mockDb.transaction.createMany).not.toHaveBeenCalled();
    });

    it("should handle batch with mixed null and valid categories", async () => {
      // User's accounts exist
      mockDb.financeAccount.findMany.mockResolvedValue([
        { id: mockAccountId, userId: mockUserId },
      ]);

      // Category belongs to user
      mockDb.category.findMany.mockResolvedValue([
        { id: mockCategoryId, userId: mockUserId },
      ]);

      mockDb.transaction.createMany.mockResolvedValue({ count: 2 });

      const request = new Request("http://localhost/api/transactions", {
        method: "POST",
        body: JSON.stringify([
          {
            accountId: mockAccountId,
            categoryId: mockCategoryId,
            description: "Categorized transaction",
            amount: -50,
            date: "2024-01-15",
          },
          {
            accountId: mockAccountId,
            categoryId: null, // Explicitly null
            description: "Uncategorized transaction",
            amount: -25,
            date: "2024-01-16",
          },
        ]),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);

      // Only the valid categoryId should be checked (null filtered out)
      expect(mockDb.category.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [mockCategoryId] },
          userId: mockUserId,
        },
      });
    });
  });

  describe("PATCH /api/transactions/[id] - Update transaction", () => {
    const mockTransactionId = "txn-123";

    it("should reject update with category owned by another user", async () => {
      // Transaction exists and belongs to user
      mockDb.transaction.findFirst.mockResolvedValue({
        id: mockTransactionId,
        userId: mockUserId,
      });

      // Category does NOT belong to user
      mockDb.category.findFirst.mockResolvedValue(null);

      const request = new Request(
        `http://localhost/api/transactions/${mockTransactionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            categoryId: mockOtherUserCategoryId,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mockTransactionId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_CATEGORY");
      expect(data.error.message).toBe("Category not found");

      // Verify category ownership was checked
      expect(mockDb.category.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockOtherUserCategoryId,
          userId: mockUserId,
        },
      });

      // Verify transaction was NOT updated
      expect(mockDb.transaction.update).not.toHaveBeenCalled();
    });

    it("should allow update with category owned by the user", async () => {
      // Transaction exists and belongs to user
      mockDb.transaction.findFirst.mockResolvedValue({
        id: mockTransactionId,
        userId: mockUserId,
      });

      // Category belongs to user
      mockDb.category.findFirst.mockResolvedValue({
        id: mockCategoryId,
        userId: mockUserId,
      });

      // Transaction updated successfully
      mockDb.transaction.update.mockResolvedValue({
        id: mockTransactionId,
        categoryId: mockCategoryId,
        date: new Date(Date.UTC(2024, 0, 15)),
        category: { id: mockCategoryId, name: "Food" },
        account: { id: mockAccountId, name: "Checking" },
      });

      const request = new Request(
        `http://localhost/api/transactions/${mockTransactionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            categoryId: mockCategoryId,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mockTransactionId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify transaction was updated
      expect(mockDb.transaction.update).toHaveBeenCalled();
    });

    it("should allow setting categoryId to null (uncategorize)", async () => {
      // Transaction exists and belongs to user
      mockDb.transaction.findFirst.mockResolvedValue({
        id: mockTransactionId,
        userId: mockUserId,
        categoryId: mockCategoryId,
      });

      // Transaction updated successfully
      mockDb.transaction.update.mockResolvedValue({
        id: mockTransactionId,
        categoryId: null,
        date: new Date(Date.UTC(2024, 0, 15)),
        category: null,
        account: { id: mockAccountId, name: "Checking" },
      });

      const request = new Request(
        `http://localhost/api/transactions/${mockTransactionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            categoryId: null,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mockTransactionId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Category validation should NOT be called for null
      expect(mockDb.category.findFirst).not.toHaveBeenCalled();

      // Transaction should be updated
      expect(mockDb.transaction.update).toHaveBeenCalled();
    });

    it("should allow update without categoryId field", async () => {
      // Transaction exists and belongs to user
      mockDb.transaction.findFirst.mockResolvedValue({
        id: mockTransactionId,
        userId: mockUserId,
      });

      // Transaction updated successfully
      mockDb.transaction.update.mockResolvedValue({
        id: mockTransactionId,
        description: "Updated description",
        date: new Date(Date.UTC(2024, 0, 15)),
        category: null,
        account: { id: mockAccountId, name: "Checking" },
      });

      const request = new Request(
        `http://localhost/api/transactions/${mockTransactionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            description: "Updated description",
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mockTransactionId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Category validation should NOT be called
      expect(mockDb.category.findFirst).not.toHaveBeenCalled();
    });

    it("should reject update for non-existent transaction", async () => {
      // Transaction does not exist
      mockDb.transaction.findFirst.mockResolvedValue(null);

      const request = new Request(
        `http://localhost/api/transactions/${mockTransactionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            categoryId: mockCategoryId,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mockTransactionId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");

      // Neither category check nor update should happen
      expect(mockDb.category.findFirst).not.toHaveBeenCalled();
      expect(mockDb.transaction.update).not.toHaveBeenCalled();
    });

    it("should serialize date field in response", async () => {
      mockDb.transaction.findFirst.mockResolvedValue({
        id: mockTransactionId,
        userId: mockUserId,
      });

      mockDb.category.findFirst.mockResolvedValue({
        id: mockCategoryId,
        userId: mockUserId,
      });

      mockDb.transaction.update.mockResolvedValue({
        id: mockTransactionId,
        categoryId: mockCategoryId,
        date: new Date(Date.UTC(2024, 0, 15)),
        category: { id: mockCategoryId, name: "Food" },
        account: { id: mockAccountId, name: "Checking" },
      });

      const request = new Request(
        `http://localhost/api/transactions/${mockTransactionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            categoryId: mockCategoryId,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mockTransactionId }),
      });
      const data = await response.json();

      // Verify date is serialized as string in API response
      expect(data.data.date).toBe("2024-01-15");
      expect(typeof data.data.date).toBe("string");
    });
  });

  describe("Authentication", () => {
    it("POST should reject unauthenticated requests", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new Request("http://localhost/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          accountId: mockAccountId,
          description: "Test",
          amount: -50,
          date: "2024-01-15",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("PATCH should reject unauthenticated requests", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new Request("http://localhost/api/transactions/txn-123", {
        method: "PATCH",
        body: JSON.stringify({ categoryId: mockCategoryId }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "txn-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });
  });
});
