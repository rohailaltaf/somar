"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "./use-database";
import * as CategoryService from "@/services/categories";
import type { CategoryType } from "@somar/shared";

/**
 * Hook for accessing categories.
 */
export function useCategories(type?: CategoryType) {
  const { db, isReady } = useDatabase();

  const query = useQuery({
    queryKey: ["categories", type],
    queryFn: () => {
      if (!db) return [];
      return type
        ? CategoryService.getCategoriesByType(db, type)
        : CategoryService.getAllCategories(db);
    },
    enabled: isReady,
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
  const { db, isReady } = useDatabase();

  return useQuery({
    queryKey: ["categories", "withBudgets", currentMonth],
    queryFn: () => {
      if (!db) return [];
      return CategoryService.getCategoriesWithBudgets(db, currentMonth);
    },
    enabled: isReady,
  });
}

/**
 * Hook for category mutations (create, update, delete, budget).
 */
export function useCategoryMutations() {
  const { db, isReady, save } = useDatabase();
  const queryClient = useQueryClient();

  const invalidateAndSave = async () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["spending"] });
    // Trigger save to persist changes to server
    await save();
  };

  const createCategory = useMutation({
    mutationFn: (input: CategoryService.CreateCategoryInput) => {
      if (!db) throw new Error("Database not ready");
      return Promise.resolve(CategoryService.createCategory(db, input));
    },
    onSuccess: invalidateAndSave,
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, name, type, color }: { id: string; name: string; type: CategoryType; color: string }) => {
      if (!db) throw new Error("Database not ready");
      CategoryService.updateCategory(db, id, name, type, color);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => {
      if (!db) throw new Error("Database not ready");
      CategoryService.deleteCategory(db, id);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const setBudget = useMutation({
    mutationFn: ({ categoryId, amount, startMonth }: { categoryId: string; amount: number; startMonth: string }) => {
      if (!db) throw new Error("Database not ready");
      return Promise.resolve(CategoryService.setBudget(db, categoryId, amount, startMonth));
    },
    onSuccess: invalidateAndSave,
  });

  const deleteBudget = useMutation({
    mutationFn: (budgetId: string) => {
      if (!db) throw new Error("Database not ready");
      CategoryService.deleteBudget(db, budgetId);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    setBudget,
    deleteBudget,
    isReady,
  };
}
