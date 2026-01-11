/**
 * Category service - API client for category operations.
 */

import { apiGet, apiPost, apiPatch, apiDelete, type ApiResponse } from "../api-client";
import type {
  Category,
  CategoryBudget,
  CategoryType,
  CategoryWithBudget,
  CreateCategoryInput,
} from "../types";

// ============ Queries ============

export async function getAllCategories(): Promise<Category[]> {
  const response = await apiGet<ApiResponse<Category[]>>("/api/categories");
  return response.data ?? [];
}

export async function getCategoriesByType(type: CategoryType): Promise<Category[]> {
  const response = await apiGet<ApiResponse<Category[]>>(`/api/categories?type=${type}`);
  return response.data ?? [];
}

export async function getCategoriesWithBudgets(currentMonth: string): Promise<CategoryWithBudget[]> {
  const response = await apiGet<ApiResponse<CategoryWithBudgetRaw[]>>(
    `/api/categories?type=spending&withBudgets=${currentMonth}`
  );

  // Map to expected format
  return (response.data ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type as CategoryType,
    color: cat.color,
    createdAt: cat.createdAt,
    currentBudget: cat.budgets?.[0]
      ? {
          id: cat.budgets[0].id,
          categoryId: cat.budgets[0].categoryId,
          amount: cat.budgets[0].amount,
          startMonth: cat.budgets[0].startMonth,
          createdAt: cat.budgets[0].createdAt,
        }
      : null,
    allBudgets: cat.budgets ?? [],
  }));
}

// ============ Mutations ============

export async function createCategory(input: CreateCategoryInput): Promise<string> {
  const response = await apiPost<ApiResponse<{ id: string }>>("/api/categories", input);
  return response.data!.id;
}

export async function updateCategory(
  id: string,
  name: string,
  type: CategoryType,
  color: string
): Promise<void> {
  await apiPatch<ApiResponse<Category>>(`/api/categories/${id}`, { name, type, color });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/api/categories/${id}`);
}

export async function setBudget(
  categoryId: string,
  amount: number,
  startMonth: string
): Promise<string> {
  const response = await apiPost<ApiResponse<{ id: string }>>("/api/budgets", {
    categoryId,
    amount,
    startMonth,
  });
  return response.data!.id;
}

export async function deleteBudget(budgetId: string): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/api/budgets/${budgetId}`);
}

// ============ Types ============

interface CategoryWithBudgetRaw {
  id: string;
  name: string;
  type: string;
  color: string;
  createdAt: string;
  budgets?: CategoryBudget[];
}
