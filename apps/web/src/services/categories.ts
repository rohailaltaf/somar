/**
 * Category service - encapsulates all category-related database operations.
 * This is a pure data layer with NO React/UI dependencies.
 */

import type { Database } from "sql.js";
import type { CategoryType } from "@somar/shared";

// Re-export shared types for convenience
export type { CategoryType } from "@somar/shared";

// ============ Types ============

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  createdAt: string;
}

export interface CategoryBudget {
  id: string;
  categoryId: string;
  amount: number;
  startMonth: string;
  createdAt: string;
}

export interface CategoryWithBudget extends Category {
  currentBudget: CategoryBudget | null;
  allBudgets: CategoryBudget[];
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  color: string;
}

// ============ Queries ============

export function getAllCategories(db: Database): Category[] {
  return queryAll<RawCategory>(
    db,
    "SELECT * FROM categories ORDER BY name"
  ).map(mapCategoryRow);
}

export function getCategoriesByType(
  db: Database,
  type: CategoryType
): Category[] {
  return queryAll<RawCategory>(
    db,
    "SELECT * FROM categories WHERE type = ? ORDER BY name",
    [type]
  ).map(mapCategoryRow);
}

export function getCategoriesWithBudgets(
  db: Database,
  currentMonth: string
): CategoryWithBudget[] {
  const categories = getCategoriesByType(db, "spending");
  
  return categories.map(cat => {
    const allBudgets = queryAll<RawBudget>(
      db,
      `SELECT * FROM category_budgets WHERE category_id = ? ORDER BY start_month DESC`,
      [cat.id]
    ).map(mapBudgetRow);
    
    const currentBudget = queryOne<RawBudget>(
      db,
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

export function getCategoryById(db: Database, id: string): Category | null {
  const row = queryOne<RawCategory>(
    db,
    "SELECT * FROM categories WHERE id = ?",
    [id]
  );
  return row ? mapCategoryRow(row) : null;
}

// ============ Mutations ============

export function createCategory(db: Database, input: CreateCategoryInput): string {
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO categories (id, name, type, color, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.type, input.color, new Date().toISOString()]
  );
  return id;
}

export function updateCategory(
  db: Database,
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

export function deleteCategory(db: Database, id: string): void {
  // Transactions with this category will have category_id set to NULL (ON DELETE SET NULL)
  db.run("DELETE FROM categories WHERE id = ?", [id]);
}

export function setBudget(
  db: Database,
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

export function deleteBudget(db: Database, budgetId: string): void {
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

// ============ Database Query Helpers ============

type SqlParam = string | number | null | Uint8Array;

function queryOne<T>(db: Database, sql: string, params?: SqlParam[]): T | undefined {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as (string | number | null | Uint8Array)[]);
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

function queryAll<T>(db: Database, sql: string, params?: SqlParam[]): T[] {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as (string | number | null | Uint8Array)[]);
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

