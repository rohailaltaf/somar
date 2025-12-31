/**
 * Category type definitions.
 */

import type { CategoryType } from "./primitives";

/**
 * A transaction category (spending, income, or transfer).
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  createdAt: string;
}

/**
 * A budget for a category, effective from a specific month.
 */
export interface CategoryBudget {
  id: string;
  categoryId: string;
  amount: number;
  startMonth: string;
  createdAt: string;
}

/**
 * A category with its associated budget information.
 */
export interface CategoryWithBudget extends Category {
  currentBudget: CategoryBudget | null;
  allBudgets: CategoryBudget[];
}

/**
 * Input for creating a new category.
 */
export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  color: string;
}
