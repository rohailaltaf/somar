/**
 * Category service - encapsulates all category-related database operations.
 * This is a pure data layer with NO React/UI dependencies.
 *
 * Uses DatabaseAdapter interface for platform-agnostic database access.
 */

import type { DatabaseAdapter } from "../storage";
import type {
  Category,
  CategoryBudget,
  CategoryType,
  CategoryWithBudget,
  CreateCategoryInput,
} from "../types";

// ============ Queries ============

export function getAllCategories(db: DatabaseAdapter): Category[] {
  return db.all<RawCategory>(
    "SELECT * FROM categories ORDER BY name"
  ).map(mapCategoryRow);
}

export function getCategoriesByType(
  db: DatabaseAdapter,
  type: CategoryType
): Category[] {
  return db.all<RawCategory>(
    "SELECT * FROM categories WHERE type = ? ORDER BY name",
    [type]
  ).map(mapCategoryRow);
}

export function getCategoriesWithBudgets(
  db: DatabaseAdapter,
  currentMonth: string
): CategoryWithBudget[] {
  const categories = getCategoriesByType(db, "spending");

  return categories.map(cat => {
    const allBudgets = db.all<RawBudget>(
      `SELECT * FROM category_budgets WHERE category_id = ? ORDER BY start_month DESC`,
      [cat.id]
    ).map(mapBudgetRow);

    const currentBudget = db.get<RawBudget>(
      `SELECT * FROM category_budgets
       WHERE category_id = ? AND start_month <= ?
       ORDER BY start_month DESC LIMIT 1`,
      [cat.id, currentMonth]
    );

    return {
      ...cat,
      currentBudget: currentBudget ? mapBudgetRow(currentBudget) : null,
      allBudgets,
    };
  });
}

// ============ Mutations ============

export function createCategory(db: DatabaseAdapter, input: CreateCategoryInput): string {
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO categories (id, name, type, color, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.type, input.color, new Date().toISOString()]
  );
  return id;
}

export function updateCategory(
  db: DatabaseAdapter,
  id: string,
  name: string,
  type: CategoryType,
  color: string
): void {
  db.run(
    "UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?",
    [name, type, color, id]
  );
}

export function deleteCategory(db: DatabaseAdapter, id: string): void {
  // Transactions with this category will have category_id set to NULL (ON DELETE SET NULL)
  db.run("DELETE FROM categories WHERE id = ?", [id]);
}

export function setBudget(
  db: DatabaseAdapter,
  categoryId: string,
  amount: number,
  startMonth: string
): string {
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO category_budgets (id, category_id, amount, start_month, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, categoryId, amount, startMonth, new Date().toISOString()]
  );
  return id;
}

export function deleteBudget(db: DatabaseAdapter, budgetId: string): void {
  db.run("DELETE FROM category_budgets WHERE id = ?", [budgetId]);
}

// ============ Helpers ============

interface RawCategory {
  id: string;
  name: string;
  type: string;
  color: string;
  created_at: string;
}

interface RawBudget {
  id: string;
  category_id: string;
  amount: number;
  start_month: string;
  created_at: string;
}

function mapCategoryRow(row: RawCategory): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type as CategoryType,
    color: row.color,
    createdAt: row.created_at,
  };
}

function mapBudgetRow(row: RawBudget): CategoryBudget {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    startMonth: row.start_month,
    createdAt: row.created_at,
  };
}
