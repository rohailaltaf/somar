/**
 * Demo Plaid utilities.
 * Provides fake bank institutions and functions for demo mode.
 */

import { db } from "./db";
import { v4 as uuid } from "uuid";
import { DEMO_MERCHANTS, DEMO_INCOME_SOURCES, type Merchant } from "./demo-data/merchants";

/**
 * Demo institutions for fake bank connections.
 */
export const DEMO_INSTITUTIONS = [
  {
    id: "demo_chase",
    name: "Chase Demo",
    logo: "https://logo.clearbit.com/chase.com",
    color: "#0055a5",
  },
  {
    id: "demo_bofa",
    name: "Bank of America Demo",
    logo: "https://logo.clearbit.com/bankofamerica.com",
    color: "#c41230",
  },
  {
    id: "demo_wells",
    name: "Wells Fargo Demo",
    logo: "https://logo.clearbit.com/wellsfargo.com",
    color: "#d71e28",
  },
  {
    id: "demo_citi",
    name: "Citi Demo",
    logo: "https://logo.clearbit.com/citi.com",
    color: "#003b70",
  },
] as const;

export type DemoInstitution = (typeof DEMO_INSTITUTIONS)[number];

/**
 * Check if a link token is a demo token.
 */
export function isDemoLinkToken(linkToken: string): boolean {
  return linkToken.startsWith("demo-link-token-");
}

/**
 * Generate a demo link token.
 */
export function generateDemoLinkToken(): string {
  return `demo-link-token-${uuid()}`;
}

/**
 * Check if a public token is a demo token.
 */
export function isDemoPublicToken(publicToken: string): boolean {
  return publicToken.startsWith("demo-public-token-");
}

/**
 * Parse a demo public token to get the institution info.
 */
export function parseDemoPublicToken(publicToken: string): { institutionId: string; institutionName: string } | null {
  if (!isDemoPublicToken(publicToken)) {
    return null;
  }

  // Format: demo-public-token-{institutionId}-{uuid}
  const parts = publicToken.split("-");
  if (parts.length < 5) {
    return null;
  }

  const institutionId = parts[3];
  const institution = DEMO_INSTITUTIONS.find((i) => i.id === institutionId);
  if (!institution) {
    return null;
  }

  return {
    institutionId: institution.id,
    institutionName: institution.name,
  };
}

/**
 * Generate a demo public token for an institution.
 */
export function generateDemoPublicToken(institutionId: string): string {
  return `demo-public-token-${institutionId}-${uuid()}`;
}

/**
 * Account types and names by institution.
 */
const DEMO_ACCOUNT_CONFIGS: Record<string, Array<{ name: string; type: string; subtype: string }>> = {
  demo_chase: [
    { name: "Chase Total Checking", type: "depository", subtype: "checking" },
    { name: "Chase Savings", type: "depository", subtype: "savings" },
    { name: "Chase Sapphire Preferred", type: "credit", subtype: "credit card" },
  ],
  demo_bofa: [
    { name: "Bank of America Checking", type: "depository", subtype: "checking" },
    { name: "Bank of America Savings", type: "depository", subtype: "savings" },
    { name: "Cash Rewards Credit Card", type: "credit", subtype: "credit card" },
  ],
  demo_wells: [
    { name: "Everyday Checking", type: "depository", subtype: "checking" },
    { name: "Way2Save Savings", type: "depository", subtype: "savings" },
    { name: "Active Cash Card", type: "credit", subtype: "credit card" },
  ],
  demo_citi: [
    { name: "Citi Checking", type: "depository", subtype: "checking" },
    { name: "Citi Savings", type: "depository", subtype: "savings" },
    { name: "Citi Double Cash", type: "credit", subtype: "credit card" },
  ],
};

/**
 * Create a demo Plaid item with accounts for a user.
 */
export async function createDemoPlaidItem(
  userId: string,
  institutionId: string,
  institutionName: string
): Promise<{ plaidItemId: string; accountIds: string[] }> {
  // Create the PlaidItem
  const plaidItem = await db.plaidItem.create({
    data: {
      userId,
      accessToken: `demo-access-token-${uuid()}`,
      institutionId,
      institutionName,
      cursor: null,
      lastSyncedAt: new Date(),
    },
  });

  // Get account configs for this institution
  const accountConfigs = DEMO_ACCOUNT_CONFIGS[institutionId] || DEMO_ACCOUNT_CONFIGS.demo_chase;

  // Create PlaidAccountMeta entries
  const plaidAccountIds: string[] = [];
  for (const config of accountConfigs) {
    const plaidAccountId = `demo-account-${uuid()}`;
    await db.plaidAccountMeta.create({
      data: {
        plaidItemId: plaidItem.id,
        plaidAccountId,
        name: config.name,
        type: config.type,
        subtype: config.subtype,
      },
    });
    plaidAccountIds.push(plaidAccountId);
  }

  // Create FinanceAccount entries
  const accountIds: string[] = [];
  for (let i = 0; i < accountConfigs.length; i++) {
    const config = accountConfigs[i];
    const financeAccount = await db.financeAccount.create({
      data: {
        userId,
        name: config.name,
        type: config.subtype === "checking" ? "checking" : config.subtype === "savings" ? "savings" : "credit_card",
        plaidAccountId: plaidAccountIds[i],
      },
    });
    accountIds.push(financeAccount.id);
  }

  return {
    plaidItemId: plaidItem.id,
    accountIds,
  };
}

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
 * Generate demo transactions for sync.
 * This generates transactions for the past 30 days.
 */
export async function generateSyncTransactions(
  userId: string,
  accountIds: string[]
): Promise<number> {
  // Get user's categories
  const categories = await db.category.findMany({
    where: { userId },
  });

  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  const transactions: Array<{
    userId: string;
    accountId: string;
    categoryId: string | null;
    description: string;
    amount: number;
    date: Date;
    isConfirmed: boolean;
    plaidTransactionId: string;
  }> = [];

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Generate transactions for each day
  for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dayOfMonth = d.getDate();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    // Generate 1-4 transactions per day
    const numTransactions = randomIntBetween(1, 4);

    for (let i = 0; i < numTransactions; i++) {
      // Pick a random category
      const categoryData = randomChoice(DEMO_MERCHANTS);
      const category = categoryByName.get(categoryData.categoryName);
      if (!category) continue;

      const merchant = randomChoice(categoryData.merchants);
      const amount = -randomAmount(merchant); // Negative for expenses
      const accountId = randomChoice(accountIds);

      transactions.push({
        userId,
        accountId,
        categoryId: category.id,
        description: merchant.name,
        amount,
        date,
        isConfirmed: Math.random() < 0.75, // 75% confirmed
        plaidTransactionId: `demo-txn-${uuid()}`,
      });
    }

    // Add income transactions on the 1st and 15th
    if (dayOfMonth === 1 || dayOfMonth === 15) {
      const incomeCategory = categoryByName.get("job income");
      if (incomeCategory) {
        const paycheck = DEMO_INCOME_SOURCES[0];
        transactions.push({
          userId,
          accountId: accountIds[0], // Use first account (usually checking)
          categoryId: incomeCategory.id,
          description: paycheck.name,
          amount: randomAmount(paycheck),
          date,
          isConfirmed: true,
          plaidTransactionId: `demo-txn-${uuid()}`,
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
    skipDuplicates: true,
  });

  return transactions.length;
}
