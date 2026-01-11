"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as CategoryService from "../services/categories";
import type { CategoryType, CreateCategoryInput } from "../types";

/**
 * Hook for accessing categories.
 */
export function useCategories(type?: CategoryType) {
  const query = useQuery({
    queryKey: ["categories", type],
    queryFn: () =>
      type
        ? CategoryService.getCategoriesByType(type)
        : CategoryService.getAllCategories(),
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook for accessing spending categories with their budgets.
 */
export function useCategoriesWithBudgets(currentMonth: string) {
  return useQuery({
    queryKey: ["categories", "withBudgets", currentMonth],
    queryFn: () => CategoryService.getCategoriesWithBudgets(currentMonth),
  });
}

/**
 * Hook for category mutations (create, update, delete, budget).
 */
export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["spending"] });
  };

  const createCategory = useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      CategoryService.createCategory(input),
    onSuccess: invalidate,
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, name, type, color }: { id: string; name: string; type: CategoryType; color: string }) =>
      CategoryService.updateCategory(id, name, type, color),
    onSuccess: invalidate,
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) =>
      CategoryService.deleteCategory(id),
    onSuccess: invalidate,
  });

  const setBudget = useMutation({
    mutationFn: ({ categoryId, amount, startMonth }: { categoryId: string; amount: number; startMonth: string }) =>
      CategoryService.setBudget(categoryId, amount, startMonth),
    onSuccess: invalidate,
  });

  const deleteBudget = useMutation({
    mutationFn: (budgetId: string) =>
      CategoryService.deleteBudget(budgetId),
    onSuccess: invalidate,
  });

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    setBudget,
    deleteBudget,
  };
}
