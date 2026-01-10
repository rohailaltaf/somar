import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSpendingByCategory } from "../transactions";
import type { DatabaseAdapter } from "../../storage/types";

/**
 * Creates a mock DatabaseAdapter for testing.
 */
function createMockAdapter(mockData: Record<string, unknown[]> = {}): DatabaseAdapter {
  return {
    all: vi.fn((sql: string) => {
      // Return mock data based on SQL pattern
      if (sql.includes("categories")) {
        return mockData.categories || [];
      }
      return [];
    }),
    get: vi.fn(() => undefined),
    run: vi.fn(),
    exec: vi.fn(),
  };
}

describe("getSpendingByCategory", () => {
  const mockCategoryData = [
    { id: "cat-1", name: "restaurant", color: "oklch(0.65 0.2 30)", spent: 250.5, budget_amount: 300 },
    { id: "cat-2", name: "groceries", color: "oklch(0.7 0.15 140)", spent: 180.25, budget_amount: 400 },
    { id: "cat-3", name: "entertainment", color: "oklch(0.6 0.18 280)", spent: 75.0, budget_amount: 100 },
    { id: "cat-4", name: "utilities", color: "oklch(0.5 0.1 200)", spent: 0, budget_amount: 150 },
    { id: "cat-5", name: "transport", color: "oklch(0.55 0.12 60)", spent: 45.0, budget_amount: null },
  ];

  describe("without options", () => {
    it("should return all spending categories", () => {
      const mockAdapter = createMockAdapter({ categories: mockCategoryData });

      const result = getSpendingByCategory(mockAdapter, "2025-01");

      expect(result).toHaveLength(5);
      expect(mockAdapter.all).toHaveBeenCalledTimes(1);
    });

    it("should map database fields correctly", () => {
      const mockAdapter = createMockAdapter({ categories: mockCategoryData });

      const result = getSpendingByCategory(mockAdapter, "2025-01");

      expect(result[0]).toEqual({
        id: "cat-1",
        name: "restaurant",
        color: "oklch(0.65 0.2 30)",
        spent: 250.5,
        budget: 300,
      });
    });

    it("should handle null budget_amount", () => {
      const mockAdapter = createMockAdapter({ categories: mockCategoryData });

      const result = getSpendingByCategory(mockAdapter, "2025-01");
      const transport = result.find((c) => c.name === "transport");

      expect(transport?.budget).toBeNull();
    });

    it("should pass month parameter to query", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-03");

      expect(mockAdapter.all).toHaveBeenCalledWith(
        expect.any(String),
        ["2025-03", "2025-03%"]
      );
    });
  });

  describe("with limit option", () => {
    it("should pass limit parameter to query", () => {
      const mockAdapter = createMockAdapter({ categories: mockCategoryData.slice(0, 3) });

      getSpendingByCategory(mockAdapter, "2025-01", { limit: 3 });

      expect(mockAdapter.all).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT"),
        ["2025-01", "2025-01%", 3]
      );
    });

    it("should include LIMIT clause in SQL", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01", { limit: 5 });

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("LIMIT ?");
    });
  });

  describe("with minSpent option", () => {
    it("should pass minSpent parameter to query", () => {
      const mockAdapter = createMockAdapter({ categories: mockCategoryData.filter((c) => c.spent > 0) });

      getSpendingByCategory(mockAdapter, "2025-01", { minSpent: 0 });

      expect(mockAdapter.all).toHaveBeenCalledWith(
        expect.stringContaining("HAVING"),
        ["2025-01", "2025-01%", 0]
      );
    });

    it("should include HAVING clause in SQL", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01", { minSpent: 50 });

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("HAVING spent > ?");
    });
  });

  describe("with both options", () => {
    it("should pass both parameters in correct order", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01", { minSpent: 10, limit: 5 });

      expect(mockAdapter.all).toHaveBeenCalledWith(
        expect.any(String),
        ["2025-01", "2025-01%", 10, 5]
      );
    });

    it("should include both HAVING and LIMIT clauses", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01", { minSpent: 0, limit: 6 });

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("HAVING spent > ?");
      expect(sql).toContain("LIMIT ?");
    });

    it("should have HAVING before ORDER BY and outer LIMIT after", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01", { minSpent: 0, limit: 6 });

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const havingIndex = sql.indexOf("HAVING");
      const orderByIndex = sql.indexOf("ORDER BY spent DESC");
      // Find the LIMIT that comes after ORDER BY (not the one in the budget subquery)
      const limitIndex = sql.indexOf("LIMIT ?");

      expect(havingIndex).toBeGreaterThan(-1);
      expect(orderByIndex).toBeGreaterThan(-1);
      expect(limitIndex).toBeGreaterThan(-1);
      expect(havingIndex).toBeLessThan(orderByIndex);
      expect(orderByIndex).toBeLessThan(limitIndex);
    });
  });

  describe("edge cases", () => {
    it("should handle empty result set", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      const result = getSpendingByCategory(mockAdapter, "2025-01");

      expect(result).toEqual([]);
    });

    it("should handle undefined options gracefully", () => {
      const mockAdapter = createMockAdapter({ categories: mockCategoryData });

      // Should not throw
      const result = getSpendingByCategory(mockAdapter, "2025-01", undefined);

      expect(result).toHaveLength(5);
    });

    it("should handle empty options object", () => {
      const mockAdapter = createMockAdapter({ categories: mockCategoryData });

      const result = getSpendingByCategory(mockAdapter, "2025-01", {});

      expect(result).toHaveLength(5);
      // Should NOT include HAVING or LIMIT
      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).not.toContain("HAVING");
      expect(sql).not.toContain("LIMIT ?");
    });

    it("should handle minSpent of 0", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01", { minSpent: 0 });

      // minSpent: 0 should still add HAVING clause
      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("HAVING spent > ?");
      expect(mockAdapter.all).toHaveBeenCalledWith(
        expect.any(String),
        ["2025-01", "2025-01%", 0]
      );
    });

    it("should handle limit of 1", () => {
      const mockAdapter = createMockAdapter({ categories: [mockCategoryData[0]] });

      const result = getSpendingByCategory(mockAdapter, "2025-01", { limit: 1 });

      expect(mockAdapter.all).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT"),
        ["2025-01", "2025-01%", 1]
      );
    });
  });

  describe("SQL structure", () => {
    it("should query categories joined with transactions", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01");

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("FROM categories c");
      expect(sql).toContain("LEFT JOIN transactions t");
    });

    it("should filter for spending categories only", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01");

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("c.type = 'spending'");
    });

    it("should filter for expenses (negative amounts)", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01");

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("t.amount < 0");
    });

    it("should exclude excluded transactions", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01");

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("t.excluded = 0");
    });

    it("should order by spent descending", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01");

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("ORDER BY spent DESC");
    });

    it("should group by category id", () => {
      const mockAdapter = createMockAdapter({ categories: [] });

      getSpendingByCategory(mockAdapter, "2025-01");

      const sql = (mockAdapter.all as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("GROUP BY c.id");
    });
  });
});
