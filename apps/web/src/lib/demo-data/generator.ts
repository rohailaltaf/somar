/**
 * Demo data generator.
 * Creates realistic demo data for a user.
 */

import { db } from "@/lib/db";
import { toDateString, parseDate } from "@somar/shared/utils";
import {
  DEMO_MERCHANTS,
  DEMO_INCOME_SOURCES,
  DEMO_TRANSFERS,
  DEMO_ACCOUNTS,
  DEMO_BUDGETS,
  type Merchant,
} from "./merchants";

/**
 * Generate a random number between min and max.
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min and max (inclusive).
 */
function randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * Pick a random item from an array.
 */
function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Generate a random amount within a merchant's range, rounded to cents.
 */
function randomAmount(merchant: Merchant): number {
  const amount = randomBetween(merchant.minAmount, merchant.maxAmount);
  return Math.round(amount * 100) / 100;
}

/**
 * Generate a random date within a month.
 */
function randomDateInMonth(year: number, month: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = randomIntBetween(1, daysInMonth);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Generate demo data for a user.
 * This creates accounts, budgets, and ~2 years of transactions.
 */
export async function generateDemoData(userId: string): Promise<void> {
  // Get the user's categories (created by Better Auth hook)
  const categories = await db.category.findMany({
    where: { userId },
  });

  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  // Create accounts
  const accountPromises = DEMO_ACCOUNTS.map((acc) =>
    db.financeAccount.create({
      data: {
        userId,
        name: acc.name,
        type: acc.type,
      },
    })
  );

  const accounts = await Promise.all(accountPromises);
  const accountByType = {
    checking: accounts.filter((a) => a.type === "checking"),
    savings: accounts.filter((a) => a.type === "savings"),
    credit_card: accounts.filter((a) => a.type === "credit_card"),
  };

  // Create budgets for spending categories
  const currentMonth = new Date();
  const startMonth = `${currentMonth.getUTCFullYear()}-${String(currentMonth.getUTCMonth() + 1).padStart(2, "0")}`;

  const budgetPromises = Object.entries(DEMO_BUDGETS).map(async ([categoryName, amount]) => {
    const category = categoryByName.get(categoryName);
    if (!category || category.type !== "spending") return null;

    return db.categoryBudget.create({
      data: {
        categoryId: category.id,
        amount,
        startMonth,
      },
    });
  });

  await Promise.all(budgetPromises);

  // Generate transactions for the past 24 months
  const transactions: Array<{
    userId: string;
    accountId: string;
    categoryId: string | null;
    description: string;
    amount: number;
    date: Date;
    isConfirmed: boolean;
  }> = [];

  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 24);

  // Generate month by month
  for (let monthOffset = 0; monthOffset < 24; monthOffset++) {
    const year = startDate.getFullYear() + Math.floor((startDate.getMonth() + monthOffset) / 12);
    const month = (startDate.getMonth() + monthOffset) % 12;

    // Determine if transactions should be confirmed (older = more confirmed)
    // Last 2 months have ~25% unconfirmed for tagger practice
    const isRecentMonth = monthOffset >= 22;
    const confirmRate = isRecentMonth ? 0.75 : 0.98;

    // Generate spending transactions by category
    for (const categoryData of DEMO_MERCHANTS) {
      const category = categoryByName.get(categoryData.categoryName);
      if (!category) continue;

      const [minFreq, maxFreq] = categoryData.monthlyFrequency;
      const numTransactions = randomIntBetween(minFreq, maxFreq);

      for (let i = 0; i < numTransactions; i++) {
        const merchant = randomChoice(categoryData.merchants);
        const amount = -randomAmount(merchant); // Negative for expenses
        const date = randomDateInMonth(year, month);

        // Use credit cards for most purchases, checking for some
        const account =
          Math.random() < 0.7
            ? randomChoice(accountByType.credit_card)
            : randomChoice(accountByType.checking);

        transactions.push({
          userId,
          accountId: account.id,
          categoryId: category.id,
          description: merchant.name,
          amount,
          date,
          isConfirmed: Math.random() < confirmRate,
        });
      }
    }

    // Generate income (1-2 per month, usually biweekly paychecks)
    const incomeCategory = categoryByName.get("job income");
    if (incomeCategory) {
      const primaryAccount = accountByType.checking[0];

      // Two paychecks per month (1st and 15th roughly)
      const paycheck = DEMO_INCOME_SOURCES[0]; // Payroll
      const paycheckAmount = randomAmount(paycheck);

      transactions.push({
        userId,
        accountId: primaryAccount.id,
        categoryId: incomeCategory.id,
        description: paycheck.name,
        amount: paycheckAmount,
        date: new Date(Date.UTC(year, month, randomIntBetween(1, 3))),
        isConfirmed: Math.random() < confirmRate,
      });

      transactions.push({
        userId,
        accountId: primaryAccount.id,
        categoryId: incomeCategory.id,
        description: paycheck.name,
        amount: paycheckAmount + randomBetween(-100, 100), // Slight variation
        date: new Date(Date.UTC(year, month, randomIntBetween(14, 17))),
        isConfirmed: Math.random() < confirmRate,
      });

      // Occasional side income (about once every 3 months)
      if (Math.random() < 0.33) {
        const sideIncome = randomChoice(DEMO_INCOME_SOURCES.slice(1));
        transactions.push({
          userId,
          accountId: primaryAccount.id,
          categoryId: incomeCategory.id,
          description: sideIncome.name,
          amount: randomAmount(sideIncome),
          date: randomDateInMonth(year, month),
          isConfirmed: Math.random() < confirmRate,
        });
      }
    }

    // Generate transfers (2-4 per month)
    const transferCategory = categoryByName.get("transfers");
    const ccPaymentCategory = categoryByName.get("credit card payments");

    if (transferCategory || ccPaymentCategory) {
      // Credit card payment (monthly)
      if (ccPaymentCategory) {
        const ccPayment = DEMO_TRANSFERS.find((t) => t.name === "Credit Card Payment");
        if (ccPayment) {
          const checkingAccount = randomChoice(accountByType.checking);
          const creditCardAccount = randomChoice(accountByType.credit_card);

          const paymentAmount = randomAmount(ccPayment);

          // Payment from checking
          transactions.push({
            userId,
            accountId: checkingAccount.id,
            categoryId: ccPaymentCategory.id,
            description: `Payment to ${creditCardAccount.name}`,
            amount: -paymentAmount,
            date: new Date(Date.UTC(year, month, randomIntBetween(25, 28))),
            isConfirmed: Math.random() < confirmRate,
          });

          // Payment received on credit card
          transactions.push({
            userId,
            accountId: creditCardAccount.id,
            categoryId: ccPaymentCategory.id,
            description: `Payment Thank You`,
            amount: paymentAmount,
            date: new Date(Date.UTC(year, month, randomIntBetween(25, 28))),
            isConfirmed: Math.random() < confirmRate,
          });
        }
      }

      // Other transfers (savings, etc.)
      if (transferCategory && Math.random() < 0.6) {
        const transfer = randomChoice(DEMO_TRANSFERS.filter((t) => !t.name.includes("Credit Card")));
        const fromAccount = transfer.name.includes("to Savings")
          ? randomChoice(accountByType.checking)
          : randomChoice(accountByType.savings);
        const toAccount = transfer.name.includes("to Savings")
          ? randomChoice(accountByType.savings)
          : randomChoice(accountByType.checking);

        const transferAmount = randomAmount(transfer);

        // Transfer out
        transactions.push({
          userId,
          accountId: fromAccount.id,
          categoryId: transferCategory.id,
          description: transfer.name,
          amount: -transferAmount,
          date: randomDateInMonth(year, month),
          isConfirmed: Math.random() < confirmRate,
        });

        // Transfer in
        transactions.push({
          userId,
          accountId: toAccount.id,
          categoryId: transferCategory.id,
          description: transfer.name.replace("to", "from").replace("Transfer from", "Transfer from"),
          amount: transferAmount,
          date: randomDateInMonth(year, month),
          isConfirmed: Math.random() < confirmRate,
        });
      }
    }
  }

  // Batch insert transactions
  await db.transaction.createMany({
    data: transactions.map((t) => ({
      ...t,
      excluded: false,
    })),
  });
}

/**
 * Delete all demo data for a user.
 * Used when regenerating demo data.
 */
export async function deleteDemoData(userId: string): Promise<void> {
  // Delete in order to respect foreign key constraints
  await db.transaction.deleteMany({ where: { userId } });
  await db.categoryBudget.deleteMany({
    where: { category: { userId } },
  });
  await db.financeAccount.deleteMany({ where: { userId } });
  // Don't delete categories - they're set up by Better Auth hook
}
