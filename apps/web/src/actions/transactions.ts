"use server";

import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { categorizeTransaction, learnCategorizationPattern, getCategorizationRules, categorizeWithRules } from "@/lib/categorizer";
import { Prisma } from "@prisma/client";

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  excluded?: boolean;
  isConfirmed?: boolean;
}

export async function getTransactions(filters?: TransactionFilters) {
  const where: Prisma.TransactionWhereInput = {};

  if (filters?.accountId) {
    where.accountId = filters.accountId;
  }
  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters?.startDate) {
    where.date = { ...where.date as any, gte: filters.startDate };
  }
  if (filters?.endDate) {
    where.date = { ...where.date as any, lte: filters.endDate };
  }
  if (filters?.excluded !== undefined) {
    where.excluded = filters.excluded;
  }
  if (filters?.isConfirmed !== undefined) {
    where.isConfirmed = filters.isConfirmed;
  }

  const result = await db.transaction.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          createdAt: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
        },
      },
    },
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" },
    ],
  });

  return result;
}

export async function getTransaction(id: string) {
  return db.transaction.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          createdAt: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function getUnconfirmedTransactions() {
  return db.transaction.findMany({
    where: { isConfirmed: false },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          createdAt: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getUnconfirmedCount() {
  return db.transaction.count({
    where: { isConfirmed: false },
  });
}

export async function createTransaction(data: {
  accountId: string;
  description: string;
  amount: number;
  date: string;
  categoryId?: string;
  excluded?: boolean;
}) {
  const id = uuidv4();

  // Auto-categorize if no category provided
  let categoryId = data.categoryId || null;
  let isConfirmed = !!data.categoryId;

  if (!categoryId) {
    const result = await categorizeTransaction(data.description);
    categoryId = result.categoryId;
    isConfirmed = false; // Needs user confirmation
  }

  await db.transaction.create({
    data: {
      id,
      accountId: data.accountId,
      categoryId,
      description: data.description,
      amount: data.amount,
      date: data.date,
      excluded: data.excluded || false,
      isConfirmed,
      createdAt: new Date().toISOString(),
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");
  return { id };
}

export async function createManyTransactions(
  transactionList: {
    accountId: string;
    description: string;
    amount: number;
    date: string;
  }[]
) {
  const results = [];

  for (const data of transactionList) {
    const id = uuidv4();

    // Auto-categorize
    const categorization = await categorizeTransaction(data.description);

    await db.transaction.create({
      data: {
        id,
        accountId: data.accountId,
        categoryId: categorization.categoryId,
        description: data.description,
        amount: data.amount,
        date: data.date,
        excluded: false,
        isConfirmed: false,
        createdAt: new Date().toISOString(),
      },
    });

    results.push({ id, categorization });
  }

  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");
  return results;
}

export async function updateTransaction(
  id: string,
  data: {
    categoryId?: string | null;
    description?: string;
    amount?: number;
    date?: string;
    excluded?: boolean;
    isConfirmed?: boolean;
  }
) {
  await db.transaction.update({
    where: { id },
    data,
  });
  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");
}

export async function confirmTransaction(
  id: string, 
  categoryId: string,
  visibleTransactionIds?: string[]
) {
  // Get the transaction
  const transaction = await db.transaction.findUnique({
    where: { id },
  });

  if (!transaction) return { updatedTransactions: [] };

  // Get the category to check if it's a transfer type
  const category = await db.category.findUnique({
    where: { id: categoryId },
  });

  // Transfer transactions are excluded by default
  const shouldExclude = category?.type === "transfer";

  // Update transaction
  await db.transaction.update({
    where: { id },
    data: { 
      categoryId, 
      isConfirmed: true,
      excluded: shouldExclude,
    },
  });

  // Learn from this categorization
  await learnCategorizationPattern(transaction.description, categoryId);

  // IMMEDIATE: Recategorize only visible transactions (fast - what user sees in tagger)
  const updatedTransactions = await recategorizeVisibleTransactions(visibleTransactionIds || []);

  // BACKGROUND: Fire-and-forget for all other unconfirmed transactions
  // This continues running after the response is sent (don't await!)
  recategorizeRemainingTransactions(visibleTransactionIds || []).catch(() => {
    // Silently ignore errors in background job
  });

  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");
  
  return { updatedTransactions };
}

export async function uncategorizeTransaction(id: string) {
  const transaction = await db.transaction.findUnique({
    where: { id },
  });

  if (!transaction) return;

  const result = await categorizeTransaction(transaction.description);

  await db.transaction.update({
    where: { id },
    data: { 
      categoryId: result.categoryId,
      isConfirmed: false 
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");
}

/**
 * IMMEDIATE: Recategorize only transactions visible in the tagger
 * This is fast because it fetches rules ONCE and processes in memory
 */
async function recategorizeVisibleTransactions(
  visibleIds: string[]
): Promise<{ id: string; categoryId: string }[]> {
  if (visibleIds.length === 0) return [];

  // Fetch everything upfront - 3 queries total, not N+1
  const [visible, categories, rules] = await Promise.all([
    db.transaction.findMany({
      where: { 
        id: { in: visibleIds },
        isConfirmed: false,
      },
    }),
    db.category.findMany(),
    getCategorizationRules(),
  ]);

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const updated: { id: string; categoryId: string }[] = [];

  // Process all transactions - no DB queries in this loop!
  for (const txn of visible) {
    const result = categorizeWithRules(txn.description, rules);
    
    if (result.categoryId && result.categoryId !== txn.categoryId) {
      const category = categoryMap.get(result.categoryId);
      const shouldExclude = category?.type === "transfer";
      
      await db.transaction.update({
        where: { id: txn.id },
        data: { 
          categoryId: result.categoryId,
          excluded: shouldExclude,
        },
      });
      updated.push({ id: txn.id, categoryId: result.categoryId });
    }
  }
  
  return updated;
}

/**
 * BACKGROUND: Recategorize all other unconfirmed transactions
 * This runs after the response is sent - user doesn't wait for it
 */
async function recategorizeRemainingTransactions(excludeIds: string[]): Promise<void> {
  // Fetch everything upfront - 3 queries total
  // Note: We filter excludeIds in JS to avoid SQLite's ~999 parameter limit with notIn
  const [allUnconfirmed, categories, rules] = await Promise.all([
    db.transaction.findMany({
      where: { isConfirmed: false },
    }),
    db.category.findMany(),
    getCategorizationRules(),
  ]);

  // Filter out excluded IDs in JavaScript (avoids SQLite parameter limit)
  const excludeSet = new Set(excludeIds);
  const remaining = allUnconfirmed.filter(txn => !excludeSet.has(txn.id));

  if (remaining.length === 0) return;

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  // Process all transactions - no DB queries in this loop (except updates)
  for (const txn of remaining) {
    const result = categorizeWithRules(txn.description, rules);
    
    if (result.categoryId && result.categoryId !== txn.categoryId) {
      const category = categoryMap.get(result.categoryId);
      const shouldExclude = category?.type === "transfer";
      
      await db.transaction.update({
        where: { id: txn.id },
        data: { 
          categoryId: result.categoryId,
          excluded: shouldExclude,
        },
      });
    }
  }
}

export async function toggleExcluded(id: string) {
  const transaction = await db.transaction.findUnique({
    where: { id },
  });

  if (!transaction) return;

  await db.transaction.update({
    where: { id },
    data: { excluded: !transaction.excluded },
  });

  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function deleteTransaction(id: string) {
  await db.transaction.delete({
    where: { id },
  });
  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");
}

export async function deleteManyTransactions(ids: string[]) {
  await db.transaction.deleteMany({
    where: { id: { in: ids } },
  });
  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");
}

// Analytics
export async function getMonthlySpending(month?: string) {
  const targetMonth = month || getCurrentMonth();
  const startDate = `${targetMonth}-01`;
  const endDate = getLastDayOfMonth(targetMonth);

  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  // Group by category manually
  const grouped = transactions.reduce((acc, txn) => {
    const catId = txn.categoryId || "uncategorized";
    if (!acc[catId]) {
      acc[catId] = {
        categoryId: txn.categoryId,
        categoryName: txn.category?.name || null,
        categoryColor: txn.category?.color || null,
        total: 0,
      };
    }
    acc[catId].total += txn.amount;
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
}

export async function getTotalSpending(month?: string) {
  const targetMonth = month || getCurrentMonth();
  const startDate = `${targetMonth}-01`;
  const endDate = getLastDayOfMonth(targetMonth);

  const result = await db.transaction.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      category: {
        type: { not: "transfer" }, // Exclude transfers
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Return absolute value since expenses are now negative
  return Math.abs(result._sum.amount || 0);
}

export async function getSpendingByCategory(month?: string) {
  const targetMonth = month || getCurrentMonth();
  const startDate = `${targetMonth}-01`;
  const endDate = getLastDayOfMonth(targetMonth);

  // Get all transactions for the month
  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      category: {
        type: { not: "transfer" }, // Exclude transfers
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
          type: true,
        },
      },
    },
  });

  // Group spending by category (use absolute value since expenses are negative)
  const spendingMap = transactions.reduce((acc, txn) => {
    if (txn.categoryId) {
      acc[txn.categoryId] = (acc[txn.categoryId] || 0) + Math.abs(txn.amount);
    }
    return acc;
  }, {} as Record<string, number>);

  // Get all spending categories with their budgets
  const cats = await db.category.findMany({
    where: { type: "spending" },
    include: {
      budgets: {
        where: { startMonth: { lte: targetMonth } },
        orderBy: { startMonth: "desc" },
        take: 1,
      },
    },
  });

  // Combine data
  return cats.map((cat) => {
    const spent = spendingMap[cat.id] || 0;
    const budget = cat.budgets[0];
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      spent,
      budget: budget?.amount || null,
      budgetStartMonth: budget?.startMonth || null,
    };
  });
}

// Reports & Analytics
export async function getDailyCumulativeSpending(month: string) {
  const startDate = `${month}-01`;
  const endDate = getLastDayOfMonth(month);
  
  // Get all transactions for the month
  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      category: {
        type: { not: "transfer" }, // Exclude transfers
      },
    },
    select: {
      date: true,
      amount: true,
    },
    orderBy: { date: "asc" },
  });
  
  // Group by date (use absolute value since expenses are negative)
  const spendingMap = transactions.reduce((acc, txn) => {
    acc[txn.date] = (acc[txn.date] || 0) + Math.abs(txn.amount);
    return acc;
  }, {} as Record<string, number>);
  
  // Generate cumulative spending for each day of the month
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  
  let cumulative = 0;
  const result = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const dailyAmount = spendingMap[dateStr] || 0;
    cumulative += dailyAmount;
    
    result.push({
      day,
      date: dateStr,
      cumulative,
    });
  }
  
  return result;
}

export async function getYearToDateSpending(year: number) {
  const startDate = `${year}-01-01`;
  const now = new Date();
  const endDate = now.getFullYear() === year 
    ? `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-12-31`;
  
  const result = await db.transaction.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      category: {
        type: { not: "transfer" }, // Exclude transfers
      },
    },
    _sum: {
      amount: true,
    },
  });
  
  // Return absolute value since expenses are now negative
  return Math.abs(result._sum.amount || 0);
}

export async function getYearToDateCategorySpending(year: number) {
  const startDate = `${year}-01-01`;
  const now = new Date();
  const currentMonthNum = now.getFullYear() === year ? now.getMonth() + 1 : 12;
  const endDate = now.getFullYear() === year 
    ? `${year}-${String(currentMonthNum).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-12-31`;
  
  // Get spending per category
  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      category: {
        type: { not: "transfer" }, // Exclude transfers
      },
    },
    include: {
      category: true,
    },
  });

  // Group by category (use absolute value since expenses are negative)
  const spendingMap = transactions.reduce((acc, txn) => {
    if (txn.categoryId) {
      acc[txn.categoryId] = (acc[txn.categoryId] || 0) + Math.abs(txn.amount);
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Get all spending categories with ALL their budgets
  const cats = await db.category.findMany({
    where: { type: "spending" },
    include: {
      budgets: {
        orderBy: { startMonth: "desc" },
      },
    },
  });
  
  // Calculate year-to-date budget for each category
  return cats.map((cat) => {
    const spent = spendingMap[cat.id] || 0;
    
    // Sum up budgets for each month of the year so far
    let totalBudget = 0;
    for (let month = 1; month <= currentMonthNum; month++) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      
      // Find the active budget for this month (most recent start_month <= monthStr)
      const activeBudget = cat.budgets
        .filter(b => b.startMonth <= monthStr)
        .sort((a, b) => b.startMonth.localeCompare(a.startMonth))[0];
      
      if (activeBudget) {
        totalBudget += activeBudget.amount;
      }
    }
    
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      spent,
      budget: totalBudget > 0 ? totalBudget : null,
      budgetStartMonth: null, // Not applicable for year view
    };
  });
}

export async function getMonthlyCumulativeSpending(year: number) {
  const startDate = `${year}-01-01`;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const endDate = currentYear === year 
    ? `${year}-${String(currentMonthNum).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-12-31`;
  
  // Get all transactions for the year
  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      category: {
        type: { not: "transfer" }, // Exclude transfers
      },
    },
    select: {
      date: true,
      amount: true,
    },
  });
  
  // Group by month (use absolute value since expenses are negative)
  const spendingMap = transactions.reduce((acc, txn) => {
    const month = txn.date.substring(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + Math.abs(txn.amount);
    return acc;
  }, {} as Record<string, number>);
  
  // Generate cumulative spending for each month
  const maxMonth = currentYear === year ? currentMonthNum : 12;
  let cumulative = 0;
  const result = [];
  
  for (let month = 1; month <= maxMonth; month++) {
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const monthAmount = spendingMap[monthStr] || 0;
    cumulative += monthAmount;
    
    result.push({
      month,
      monthStr,
      cumulative,
    });
  }
  
  return result;
}

// Income Analytics
export async function getTotalIncome(month?: string) {
  const targetMonth = month || getCurrentMonth();
  const startDate = `${targetMonth}-01`;
  const endDate = getLastDayOfMonth(targetMonth);

  // Get all income categories
  const incomeCategories = await db.category.findMany({
    where: { type: "income" },
    select: { id: true },
  });
  const incomeCategoryIds = incomeCategories.map(cat => cat.id);

  if (incomeCategoryIds.length === 0) {
    return 0;
  }

  const result = await db.transaction.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      categoryId: { in: incomeCategoryIds },
    },
    _sum: {
      amount: true,
    },
  });

  // Return absolute value (positive number for income)
  return Math.abs(result._sum.amount || 0);
}

export async function getYearToDateIncome(year: number) {
  const startDate = `${year}-01-01`;
  const now = new Date();
  const endDate = now.getFullYear() === year 
    ? `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-12-31`;
  
  // Get all income categories
  const incomeCategories = await db.category.findMany({
    where: { type: "income" },
    select: { id: true },
  });
  const incomeCategoryIds = incomeCategories.map(cat => cat.id);

  if (incomeCategoryIds.length === 0) {
    return 0;
  }

  const result = await db.transaction.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      categoryId: { in: incomeCategoryIds },
    },
    _sum: {
      amount: true,
    },
  });
  
  // Return absolute value (positive number for income)
  return Math.abs(result._sum.amount || 0);
}

export async function getMonthlyIncome(year: number) {
  const startDate = `${year}-01-01`;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const endDate = currentYear === year 
    ? `${year}-${String(currentMonthNum).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-12-31`;
  
  // Get all income categories
  const incomeCategories = await db.category.findMany({
    where: { type: "income" },
    select: { id: true },
  });
  const incomeCategoryIds = incomeCategories.map(cat => cat.id);

  if (incomeCategoryIds.length === 0) {
    // Return empty data for all months
    const maxMonth = currentYear === year ? currentMonthNum : 12;
    const result = [];
    for (let month = 1; month <= maxMonth; month++) {
      result.push({
        month,
        monthStr: `${year}-${String(month).padStart(2, "0")}`,
        amount: 0,
      });
    }
    return result;
  }

  // Get all income transactions for the year
  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      categoryId: { in: incomeCategoryIds },
    },
    select: {
      date: true,
      amount: true,
    },
  });
  
  // Group by month
  const incomeMap = transactions.reduce((acc, txn) => {
    const month = txn.date.substring(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + Math.abs(txn.amount);
    return acc;
  }, {} as Record<string, number>);
  
  // Generate income for each month
  const maxMonth = currentYear === year ? currentMonthNum : 12;
  const result = [];
  
  for (let month = 1; month <= maxMonth; month++) {
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const monthAmount = incomeMap[monthStr] || 0;
    
    result.push({
      month,
      monthStr,
      amount: monthAmount,
    });
  }
  
  return result;
}

export async function getIncomeByCategory(month?: string) {
  const targetMonth = month || getCurrentMonth();
  const startDate = `${targetMonth}-01`;
  const endDate = getLastDayOfMonth(targetMonth);

  // Get all income categories
  const cats = await db.category.findMany({
    where: { type: "income" },
  });

  if (cats.length === 0) {
    return [];
  }

  const incomeCategoryIds = cats.map(cat => cat.id);

  // Get all income transactions for the month
  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      categoryId: { in: incomeCategoryIds },
    },
    select: {
      categoryId: true,
      amount: true,
    },
  });

  // Group income by category
  const incomeMap = transactions.reduce((acc, txn) => {
    if (txn.categoryId) {
      acc[txn.categoryId] = (acc[txn.categoryId] || 0) + Math.abs(txn.amount);
    }
    return acc;
  }, {} as Record<string, number>);

  // Combine data
  return cats.map((cat) => {
    const income = incomeMap[cat.id] || 0;
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      income,
    };
  }).filter(cat => cat.income > 0);
}

export async function getYearToDateCategoryIncome(year: number) {
  const startDate = `${year}-01-01`;
  const now = new Date();
  const endDate = now.getFullYear() === year 
    ? `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-12-31`;
  
  // Get all income categories
  const cats = await db.category.findMany({
    where: { type: "income" },
  });

  if (cats.length === 0) {
    return [];
  }

  const incomeCategoryIds = cats.map(cat => cat.id);

  // Get income per category
  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      categoryId: { in: incomeCategoryIds },
    },
    select: {
      categoryId: true,
      amount: true,
    },
  });

  // Group by category
  const incomeMap = transactions.reduce((acc, txn) => {
    if (txn.categoryId) {
      acc[txn.categoryId] = (acc[txn.categoryId] || 0) + Math.abs(txn.amount);
    }
    return acc;
  }, {} as Record<string, number>);
  
  return cats.map((cat) => {
    const income = incomeMap[cat.id] || 0;
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      income,
    };
  }).filter(cat => cat.income > 0);
}

// Get spending transactions for a month (for expandable list in reports)
export async function getSpendingTransactions(month: string) {
  const startDate = `${month}-01`;
  const endDate = getLastDayOfMonth(month);

  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      category: {
        type: { not: "transfer" }, // Exclude transfers
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return transactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: Math.abs(t.amount), // Return as positive for display
    date: t.date,
    categoryName: t.category?.name || null,
    categoryColor: t.category?.color || null,
    accountName: t.account?.name || null,
  }));
}

export async function getYearSpendingTransactions(year: number) {
  const startDate = `${year}-01-01`;
  const now = new Date();
  const endDate = now.getFullYear() === year 
    ? `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-12-31`;

  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      excluded: false,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      category: {
        type: { not: "transfer" }, // Exclude transfers
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return transactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: Math.abs(t.amount), // Return as positive for display
    date: t.date,
    categoryName: t.category?.name || null,
    categoryColor: t.category?.color || null,
    accountName: t.account?.name || null,
  }));
}

// Helper functions
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLastDayOfMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}
