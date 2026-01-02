"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabaseAdapter } from "./database-context";
import * as CategoryService from "../services/categories";
import type { CategoryType, CreateCategoryInput } from "../types";

/**
 * Hook for accessing categories.
 */
export function useCategories(type?: CategoryType) {
  const { adapter, isReady } = useDatabaseAdapter();

  const query = useQuery({
    queryKey: ["categories", type],
    queryFn: () => {
      if (!adapter) return [];
      return type
        ? CategoryService.getCategoriesByType(adapter, type)
        : CategoryService.getAllCategories(adapter);
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
  const { adapter, isReady } = useDatabaseAdapter();

  return useQuery({
    queryKey: ["categories", "withBudgets", currentMonth],
    queryFn: () => {
      if (!adapter) return [];
      return CategoryService.getCategoriesWithBudgets(adapter, currentMonth);
    },
    enabled: isReady,
  });
}

/**
 * Hook for category mutations (create, update, delete, budget).
 */
export function useCategoryMutations() {
  const { adapter, isReady, save } = useDatabaseAdapter();
  const queryClient = useQueryClient();

  const invalidateAndSave = async () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["spending"] });
    // Trigger save to persist changes to server
    await save();
  };

  const createCategory = useMutation({
    mutationFn: (input: CreateCategoryInput) => {
      if (!adapter) throw new Error("Database not ready");
      return Promise.resolve(CategoryService.createCategory(adapter, input));
    },
    onSuccess: invalidateAndSave,
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, name, type, color }: { id: string; name: string; type: CategoryType; color: string }) => {
      if (!adapter) throw new Error("Database not ready");
      CategoryService.updateCategory(adapter, id, name, type, color);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => {
      if (!adapter) throw new Error("Database not ready");
      CategoryService.deleteCategory(adapter, id);
      return Promise.resolve();
    },
    onSuccess: invalidateAndSave,
  });

  const setBudget = useMutation({
    mutationFn: ({ categoryId, amount, startMonth }: { categoryId: string; amount: number; startMonth: string }) => {
      if (!adapter) throw new Error("Database not ready");
      return Promise.resolve(CategoryService.setBudget(adapter, categoryId, amount, startMonth));
    },
    onSuccess: invalidateAndSave,
  });

  const deleteBudget = useMutation({
    mutationFn: (budgetId: string) => {
      if (!adapter) throw new Error("Database not ready");
      CategoryService.deleteBudget(adapter, budgetId);
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
