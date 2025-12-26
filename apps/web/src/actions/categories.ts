"use server";

import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export async function getCategories(type?: "spending" | "income" | "transfer") {
  return db.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getCategoriesWithBudgets(month?: string) {
  const targetMonth = month || getCurrentMonth();
  
  // Only get spending categories (income categories don't have budgets)
  const cats = await db.category.findMany({
    where: { type: "spending" },
    orderBy: { name: "asc" },
    include: {
      budgets: {
        orderBy: { startMonth: "desc" },
      },
    },
  });

  return cats.map((cat) => {
    const currentBudget = cat.budgets.find(b => b.startMonth <= targetMonth) || null;
    return {
      ...cat,
      currentBudget,
      allBudgets: cat.budgets,
    };
  });
}

export async function getCategory(id: string) {
  return db.category.findUnique({
    where: { id },
    include: {
      budgets: {
        orderBy: { startMonth: "desc" },
      },
    },
  });
}

export async function createCategory(name: string, type: "spending" | "income" | "transfer" = "spending", color?: string) {
  const id = uuidv4();
  await db.category.create({
    data: {
      id,
      name: name.toLowerCase(),
      type,
      color: color || generateColor(),
      createdAt: new Date().toISOString(),
    },
  });
  revalidatePath("/categories");
  revalidatePath("/tagger");
  return { id, name };
}

export async function updateCategory(id: string, name: string, type?: "spending" | "income" | "transfer", color?: string) {
  const updates: { name?: string; type?: "spending" | "income" | "transfer"; color?: string } = { name: name.toLowerCase() };
  if (type) updates.type = type;
  if (color) updates.color = color;
  
  await db.category.update({
    where: { id },
    data: updates,
  });
  revalidatePath("/categories");
  revalidatePath("/tagger");
}

export async function deleteCategory(id: string) {
  await db.category.delete({
    where: { id },
  });
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/tagger");
}

export async function setBudget(
  categoryId: string,
  amount: number,
  startMonth: string
) {
  // Check if a budget already exists for this category and month
  const existing = await db.categoryBudget.findFirst({
    where: {
      categoryId,
      startMonth,
    },
  });

  if (existing) {
    // Update existing budget
    await db.categoryBudget.update({
      where: { id: existing.id },
      data: { amount },
    });
  } else {
    // Create new budget
    await db.categoryBudget.create({
      data: {
        id: uuidv4(),
        categoryId,
        amount,
        startMonth,
        createdAt: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/categories");
  revalidatePath("/");
}

export async function deleteBudget(budgetId: string) {
  await db.categoryBudget.delete({
    where: { id: budgetId },
  });
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function getBudgetHistory(categoryId: string) {
  return db.categoryBudget.findMany({
    where: { categoryId },
    orderBy: { startMonth: "desc" },
  });
}

// Helper functions
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function generateColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `oklch(0.65 0.18 ${hue})`;
}

