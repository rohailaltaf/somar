"use server";

import { db } from "@/lib/db";
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES, isPlaidConfigured } from "@/lib/plaid";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import {
  Products,
  CountryCode,
  TransactionsSyncRequest,
  RemovedTransaction,
} from "plaid";
import {
  getCategorizationRules,
  categorizeWithRules,
} from "@/lib/categorizer";
import {
  findDuplicatesBatch,
  TransactionForDedup,
} from "@/lib/dedup";

// Types
export interface PlaidItemWithAccounts {
  id: string;
  institutionId: string;
  institutionName: string;
  lastSyncedAt: string | null;
  accounts: {
    id: string;
    name: string;
    type: string;
    plaidAccountId: string | null;
  }[];
}

export interface SyncResult {
  added: number;
  modified: number;
  removed: number;
  itemId: string;
}

// Get all connected Plaid items with their accounts
export async function getPlaidItems(): Promise<PlaidItemWithAccounts[]> {
  const items = await db.plaidItem.findMany({
    include: {
      accounts: {
        select: {
          id: true,
          name: true,
          type: true,
          plaidAccountId: true,
        },
      },
    },
    orderBy: { institutionName: "asc" },
  });

  return items;
}

// Get a single Plaid item by ID
export async function getPlaidItem(id: string) {
  return db.plaidItem.findUnique({
    where: { id },
    include: {
      accounts: true,
    },
  });
}

// Create a link token for Plaid Link
export async function createLinkToken(): Promise<{ linkToken: string } | { error: string }> {
  if (!isPlaidConfigured()) {
    return { error: "Plaid is not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables." };
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: "user-" + Date.now(), // In production, use actual user ID
      },
      client_name: "Personal Finance Tracker",
      products: PLAID_PRODUCTS as unknown as Products[],
      country_codes: PLAID_COUNTRY_CODES as unknown as CountryCode[],
      language: "en",
    });

    return { linkToken: response.data.link_token };
  } catch (error) {
    console.error("Error creating link token:", error);
    return { error: "Failed to create link token" };
  }
}

// Create a link token for update mode (to add/manage accounts for existing connection)
export async function createUpdateModeLinkToken(
  plaidItemId: string
): Promise<{ linkToken: string } | { error: string }> {
  if (!isPlaidConfigured()) {
    return { error: "Plaid is not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables." };
  }

  try {
    // Get the PlaidItem to retrieve the access token
    const plaidItem = await db.plaidItem.findUnique({
      where: { id: plaidItemId },
    });

    if (!plaidItem) {
      return { error: "Institution not found" };
    }

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: "user-" + Date.now(),
      },
      client_name: "Personal Finance Tracker",
      country_codes: PLAID_COUNTRY_CODES as unknown as CountryCode[],
      language: "en",
      // Pass access_token to enable update mode
      access_token: plaidItem.accessToken,
      // Enable account selection to allow adding new accounts
      update: {
        account_selection_enabled: true,
      },
    });

    return { linkToken: response.data.link_token };
  } catch (error) {
    console.error("Error creating update mode link token:", error);
    return { error: "Failed to create link token for account management" };
  }
}

// Exchange public token for access token and create accounts
export async function exchangePublicToken(
  publicToken: string,
  institutionId: string,
  institutionName: string
): Promise<{ success: true; itemId: string; accountCount: number } | { success: false; error: string }> {
  if (!isPlaidConfigured()) {
    return { success: false, error: "Plaid is not configured" };
  }

  try {
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get accounts for this item
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const plaidAccounts = accountsResponse.data.accounts;

    // Create PlaidItem in database
    const plaidItemId = uuidv4();
    await db.plaidItem.create({
      data: {
        id: plaidItemId,
        accessToken: accessToken, // In production, encrypt this
        institutionId,
        institutionName,
        createdAt: new Date().toISOString(),
      },
    });

    // Create accounts linked to the PlaidItem
    for (const plaidAccount of plaidAccounts) {
      const accountType = mapPlaidAccountType(plaidAccount.type, plaidAccount.subtype);
      const accountName = formatPlaidAccountName(institutionName, plaidAccount.name, plaidAccount.mask);
      
      await db.account.create({
        data: {
          id: uuidv4(),
          name: accountName,
          type: accountType,
          plaidItemId: plaidItemId,
          plaidAccountId: plaidAccount.account_id,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Immediately sync transactions
    await syncTransactionsForItem(plaidItemId);

    revalidatePath("/accounts");
    revalidatePath("/transactions");

    return { success: true, itemId: plaidItemId, accountCount: plaidAccounts.length };
  } catch (error) {
    console.error("Error exchanging public token:", error);
    return { success: false, error: "Failed to connect institution" };
  }
}

// Update accounts for an existing Plaid item (after user goes through update mode)
// This syncs the account list from Plaid and adds any new accounts
export async function updatePlaidItemAccounts(
  plaidItemId: string
): Promise<{ success: true; added: number; total: number } | { success: false; error: string }> {
  if (!isPlaidConfigured()) {
    return { success: false, error: "Plaid is not configured" };
  }

  try {
    const plaidItem = await db.plaidItem.findUnique({
      where: { id: plaidItemId },
      include: { accounts: true },
    });

    if (!plaidItem) {
      return { success: false, error: "Institution not found" };
    }

    // Get current accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: plaidItem.accessToken,
    });

    const plaidAccounts = accountsResponse.data.accounts;

    // Find which Plaid account IDs we already have
    const existingPlaidAccountIds = new Set(
      plaidItem.accounts
        .filter((a) => a.plaidAccountId)
        .map((a) => a.plaidAccountId)
    );

    let addedCount = 0;

    // Add any new accounts
    for (const plaidAccount of plaidAccounts) {
      if (!existingPlaidAccountIds.has(plaidAccount.account_id)) {
        const accountType = mapPlaidAccountType(plaidAccount.type, plaidAccount.subtype);
        const accountName = formatPlaidAccountName(plaidItem.institutionName, plaidAccount.name, plaidAccount.mask);

        await db.account.create({
          data: {
            id: uuidv4(),
            name: accountName,
            type: accountType,
            plaidItemId: plaidItemId,
            plaidAccountId: plaidAccount.account_id,
            createdAt: new Date().toISOString(),
          },
        });

        addedCount++;
      }
    }

    // Sync transactions to get data for new accounts
    if (addedCount > 0) {
      await syncTransactionsForItem(plaidItemId);
    }

    revalidatePath("/accounts");
    revalidatePath("/transactions");

    return { success: true, added: addedCount, total: plaidAccounts.length };
  } catch (error) {
    console.error("Error updating Plaid item accounts:", error);
    return { success: false, error: "Failed to update accounts" };
  }
}

// Sync transactions for a specific Plaid item
export async function syncTransactionsForItem(plaidItemId: string): Promise<SyncResult> {
  const plaidItem = await db.plaidItem.findUnique({
    where: { id: plaidItemId },
    include: { accounts: true },
  });

  if (!plaidItem) {
    throw new Error("Plaid item not found");
  }

  // Build a map of plaidAccountId to our account id
  const accountMap = new Map<string, string>();
  for (const account of plaidItem.accounts) {
    if (account.plaidAccountId) {
      accountMap.set(account.plaidAccountId, account.id);
    }
  }

  // Get categorization rules for auto-categorization
  const categorizationRules = await getCategorizationRules();

  // If no cursor exists, this is the initial sync - fetch up to 24 months of history
  // Otherwise, use incremental sync from last cursor position
  if (!plaidItem.cursor) {
    return await initialHistoricalSync(plaidItem, accountMap, categorizationRules);
  } else {
    return await incrementalSync(plaidItem, accountMap, categorizationRules);
  }
}

// Helper to wait for a specified time
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get a date offset by N days (positive = future, negative = past)
 */
function getOffsetDate(dateStr: string, offsetDays: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Check if a Plaid transaction duplicates an existing CSV transaction.
 * Uses the 2-tier dedup system (deterministic + LLM).
 * Returns the matched CSV transaction ID if found, null otherwise.
 */
async function findDuplicateCsvTransaction(
  accountId: string,
  amount: number,
  date: string,
  authorizedDate: string | null,
  postedDate: string,
  description: string,
  merchantName: string | null
): Promise<string | null> {
  // Get existing CSV transactions for this account with matching amount and potential dates
  // Use ±2 day window to handle bank-specific date offsets
  // - Amex: CSV matches authorized_date (0 offset)
  // - Chase: CSV is 1-2 days before posted_date (authorized_date often null)
  const potentialDates = new Set<string>();
  
  // Add ±2 days around each Plaid date
  const plaidDates = [date];
  if (authorizedDate) plaidDates.push(authorizedDate);
  if (postedDate && postedDate !== date) plaidDates.push(postedDate);
  
  for (const plaidDate of plaidDates) {
    for (let offset = -2; offset <= 2; offset++) {
      const checkDate = offset === 0 ? plaidDate : getOffsetDate(plaidDate, offset);
      potentialDates.add(checkDate);
    }
  }

  const csvTransactions = await db.transaction.findMany({
    where: {
      accountId,
      plaidTransactionId: null, // Only CSV transactions
      date: { in: Array.from(potentialDates) },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      date: true,
    },
  });

  if (csvTransactions.length === 0) return null;

  // Filter by matching absolute amount
  const absAmount = Math.abs(amount);
  const candidates = csvTransactions.filter(
    (tx) => Math.abs(Math.abs(tx.amount) - absAmount) < 0.01
  );

  if (candidates.length === 0) return null;

  // Use 2-tier dedup system (deterministic + LLM)
  const plaidTx: TransactionForDedup = {
    description,
    amount,
    date,
    plaidMerchantName: merchantName,
  };

  const existingTxs: TransactionForDedup[] = candidates.map((tx) => ({
    id: tx.id,
    description: tx.description,
    amount: tx.amount,
    date: tx.date,
  }));

  // Use 2-tier dedup (deterministic + LLM)
  const result = await findDuplicatesBatch([plaidTx], existingTxs);

  if (result.duplicates.length > 0) {
    return result.duplicates[0].matchedWith.id || null;
  }

  return null;
}

// Initial sync - fetch up to 24 months of historical transactions using transactionsGet
async function initialHistoricalSync(
  plaidItem: { id: string; accessToken: string; accounts: { id: string; plaidAccountId: string | null }[] },
  accountMap: Map<string, string>,
  categorizationRules: Awaited<ReturnType<typeof getCategorizationRules>>
): Promise<SyncResult> {
  // Calculate date range - 24 months back from today
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 24);

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  let added = 0;
  let offset = 0;
  const count = 500; // Max transactions per request
  let totalTransactions = 0;

  // Plaid needs time to prepare AND ENRICH transaction data after initial connection
  // We need to wait until:
  // 1. Transactions are available (API doesn't error)
  // 2. Transactions have enriched data (authorized_date, merchant_name)
  // Retry with exponential backoff, checking for enrichment
  const maxRetries = 8; // More retries to allow for enrichment
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Fetch first page to check if transactions are ready AND enriched
      const firstResponse = await plaidClient.transactionsGet({
        access_token: plaidItem.accessToken,
        start_date: startDateStr,
        end_date: endDateStr,
        options: {
          count,
          offset: 0,
        },
      });

      // Check if Plaid has finished enriching the data
      // Find first non-pending transaction and check if it has authorized_date
      const nonPendingTx = firstResponse.data.transactions.find(tx => !tx.pending);
      const isEnriched = nonPendingTx && nonPendingTx.authorized_date;
      
      if (!isEnriched && attempt < maxRetries - 1) {
        await delay(Math.pow(2, attempt + 1) * 1000); // 2s, 4s, 8s, 16s, 32s, 64s
        continue;
      }

      // If we get here, transactions are ready - process this page and continue
      totalTransactions = firstResponse.data.total_transactions;

      for (const transaction of firstResponse.data.transactions) {
        const accountId = accountMap.get(transaction.account_id);
        if (!accountId) continue;
        
        // Skip pending transactions - they'll be synced when posted
        if (transaction.pending) continue;

        // Check if this Plaid transaction already exists
        const existingPlaid = await db.transaction.findFirst({
          where: { plaidTransactionId: transaction.transaction_id },
        });

        if (existingPlaid) continue;

        const amount = -transaction.amount;
        const description = transaction.original_description || transaction.name || transaction.merchant_name || "Unknown";
        const primaryDate = transaction.authorized_date || transaction.date;

        // Check if this matches an existing CSV transaction
        const duplicateCsvId = await findDuplicateCsvTransaction(
          accountId,
          amount,
          primaryDate,
          transaction.authorized_date || null,
          transaction.date,
          description,
          transaction.merchant_name || null
        );

        if (duplicateCsvId) {
          // Update existing CSV transaction with Plaid data instead of creating duplicate
          await db.transaction.update({
            where: { id: duplicateCsvId },
            data: {
              plaidTransactionId: transaction.transaction_id,
              plaidOriginalDescription: transaction.original_description || null,
              plaidName: transaction.name || null,
              plaidMerchantName: transaction.merchant_name || null,
              plaidAuthorizedDate: transaction.authorized_date || null,
              plaidPostedDate: transaction.date,
            },
          });
          continue; // Skip creating new transaction
        }

        // Use merchant_name for categorization (cleanest for matching rules)
        const categoryResult = categorizeWithRules(
          transaction.merchant_name || transaction.name || "",
          categorizationRules
        );

        // Determine if this is a transfer category and should be excluded
        let excluded = false;
        if (categoryResult.categoryId) {
          const category = await db.category.findUnique({
            where: { id: categoryResult.categoryId },
          });
          if (category?.type === "transfer") {
            excluded = true;
          }
        }

        await db.transaction.create({
          data: {
            id: uuidv4(),
            accountId,
            categoryId: categoryResult.categoryId,
            description,
            amount,
            date: primaryDate,
            excluded,
            isConfirmed: false,
            plaidTransactionId: transaction.transaction_id,
            plaidOriginalDescription: transaction.original_description || null,
            plaidName: transaction.name || null,
            plaidMerchantName: transaction.merchant_name || null,
            plaidAuthorizedDate: transaction.authorized_date || null,
            plaidPostedDate: transaction.date,
            createdAt: new Date().toISOString(),
          },
        });

        added++;
      }

      offset = firstResponse.data.transactions.length;
      break; // Success - exit retry loop
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await delay(Math.pow(2, attempt + 1) * 1000);
      }
    }
  }

  // If all retries failed, throw the last error
  if (offset === 0 && lastError) {
    throw lastError;
  }

  // Fetch remaining pages
  while (offset < totalTransactions) {
    const response = await plaidClient.transactionsGet({
      access_token: plaidItem.accessToken,
      start_date: startDateStr,
      end_date: endDateStr,
      options: {
        count,
        offset,
      },
    });

    totalTransactions = response.data.total_transactions;

    for (const transaction of response.data.transactions) {
      const accountId = accountMap.get(transaction.account_id);
      if (!accountId) continue;
      
      // Skip pending transactions - they'll be synced when posted
      if (transaction.pending) continue;

      // Check if this Plaid transaction already exists
      const existingPlaid = await db.transaction.findFirst({
        where: { plaidTransactionId: transaction.transaction_id },
      });

      if (existingPlaid) continue;

      const amount = -transaction.amount;
      const description = transaction.original_description || transaction.name || transaction.merchant_name || "Unknown";
      const primaryDate = transaction.authorized_date || transaction.date;

      // Check if this matches an existing CSV transaction
      const duplicateCsvId = await findDuplicateCsvTransaction(
        accountId,
        amount,
        primaryDate,
        transaction.authorized_date || null,
        transaction.date,
        description,
        transaction.merchant_name || null
      );

      if (duplicateCsvId) {
        // Update existing CSV transaction with Plaid data instead of creating duplicate
        await db.transaction.update({
          where: { id: duplicateCsvId },
          data: {
            plaidTransactionId: transaction.transaction_id,
            plaidOriginalDescription: transaction.original_description || null,
            plaidName: transaction.name || null,
            plaidMerchantName: transaction.merchant_name || null,
            plaidAuthorizedDate: transaction.authorized_date || null,
            plaidPostedDate: transaction.date,
          },
        });
        continue;
      }

      // Use merchant_name for categorization (cleanest for matching rules)
      const categoryResult = categorizeWithRules(
        transaction.merchant_name || transaction.name || "",
        categorizationRules
      );

      // Determine if this is a transfer category and should be excluded
      let excluded = false;
      if (categoryResult.categoryId) {
        const category = await db.category.findUnique({
          where: { id: categoryResult.categoryId },
        });
        if (category?.type === "transfer") {
          excluded = true;
        }
      }

      await db.transaction.create({
        data: {
          id: uuidv4(),
          accountId,
          categoryId: categoryResult.categoryId,
          description,
          amount,
          date: primaryDate,
          excluded,
          isConfirmed: false,
          plaidTransactionId: transaction.transaction_id,
          plaidOriginalDescription: transaction.original_description || null,
          plaidName: transaction.name || null,
          plaidMerchantName: transaction.merchant_name || null,
          plaidAuthorizedDate: transaction.authorized_date || null,
          plaidPostedDate: transaction.date,
          createdAt: new Date().toISOString(),
        },
      });

      added++;
    }

    offset += response.data.transactions.length;
  }

  // After initial sync, call transactionsSync once to establish cursor for future incremental syncs
  const syncResponse = await plaidClient.transactionsSync({
    access_token: plaidItem.accessToken,
  });

  // Consume all pages to get to the latest cursor
  let cursor = syncResponse.data.next_cursor;
  let hasMore = syncResponse.data.has_more;
  
  while (hasMore) {
    const nextResponse = await plaidClient.transactionsSync({
      access_token: plaidItem.accessToken,
      cursor,
    });
    cursor = nextResponse.data.next_cursor;
    hasMore = nextResponse.data.has_more;
  }

  // Update cursor and last synced timestamp
  await db.plaidItem.update({
    where: { id: plaidItem.id },
    data: {
      cursor,
      lastSyncedAt: new Date().toISOString(),
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");

  return { added, modified: 0, removed: 0, itemId: plaidItem.id };
}

// Incremental sync - use cursor-based transactionsSync for updates since last sync
async function incrementalSync(
  plaidItem: { id: string; accessToken: string; cursor: string | null; accounts: { id: string; plaidAccountId: string | null }[] },
  accountMap: Map<string, string>,
  categorizationRules: Awaited<ReturnType<typeof getCategorizationRules>>
): Promise<SyncResult> {
  let cursor = plaidItem.cursor;
  let added = 0;
  let modified = 0;
  let removed = 0;
  let hasMore = true;

  while (hasMore) {
    const request: TransactionsSyncRequest = {
      access_token: plaidItem.accessToken,
      cursor: cursor || undefined,
    };

    const response = await plaidClient.transactionsSync(request);
    const data = response.data;

    // Process added transactions
    for (const transaction of data.added) {
      const accountId = accountMap.get(transaction.account_id);
      if (!accountId) continue;
      
      // Skip pending transactions - they'll be synced when posted
      if (transaction.pending) continue;

      // Check if this Plaid transaction already exists
      const existingPlaid = await db.transaction.findFirst({
        where: { plaidTransactionId: transaction.transaction_id },
      });

      if (existingPlaid) continue;

      const amount = -transaction.amount;
      const description = transaction.original_description || transaction.name || transaction.merchant_name || "Unknown";
      const primaryDate = transaction.authorized_date || transaction.date;

      // Check if this matches an existing CSV transaction
      const duplicateCsvId = await findDuplicateCsvTransaction(
        accountId,
        amount,
        primaryDate,
        transaction.authorized_date || null,
        transaction.date,
        description,
        transaction.merchant_name || null
      );

      if (duplicateCsvId) {
        // Update existing CSV transaction with Plaid data instead of creating duplicate
        await db.transaction.update({
          where: { id: duplicateCsvId },
          data: {
            plaidTransactionId: transaction.transaction_id,
            plaidOriginalDescription: transaction.original_description || null,
            plaidName: transaction.name || null,
            plaidMerchantName: transaction.merchant_name || null,
            plaidAuthorizedDate: transaction.authorized_date || null,
            plaidPostedDate: transaction.date,
          },
        });
        continue;
      }

      // Use merchant_name for categorization (cleanest for matching rules)
      const categoryResult = categorizeWithRules(
        transaction.merchant_name || transaction.name || "",
        categorizationRules
      );

      // Determine if this is a transfer category and should be excluded
      let excluded = false;
      if (categoryResult.categoryId) {
        const category = await db.category.findUnique({
          where: { id: categoryResult.categoryId },
        });
        if (category?.type === "transfer") {
          excluded = true;
        }
      }

      await db.transaction.create({
        data: {
          id: uuidv4(),
          accountId,
          categoryId: categoryResult.categoryId,
          description,
          amount,
          date: primaryDate,
          excluded,
          isConfirmed: false,
          plaidTransactionId: transaction.transaction_id,
          plaidOriginalDescription: transaction.original_description || null,
          plaidName: transaction.name || null,
          plaidMerchantName: transaction.merchant_name || null,
          plaidAuthorizedDate: transaction.authorized_date || null,
          plaidPostedDate: transaction.date,
          createdAt: new Date().toISOString(),
        },
      });

      added++;
    }

    // Process modified transactions
    for (const transaction of data.modified) {
      const existing = await db.transaction.findFirst({
        where: { plaidTransactionId: transaction.transaction_id },
      });

      if (existing) {
        const amount = -transaction.amount;
        const description = transaction.original_description || transaction.name || transaction.merchant_name || existing.description;
        // Use authorized_date as primary (matches CSV), fall back to date
        const primaryDate = transaction.authorized_date || transaction.date;

        await db.transaction.update({
          where: { id: existing.id },
          data: {
            description,
            amount,
            date: primaryDate,
            plaidOriginalDescription: transaction.original_description || null,
            plaidName: transaction.name || null,
            plaidMerchantName: transaction.merchant_name || null,
            // Store both dates for accurate deduplication
            plaidAuthorizedDate: transaction.authorized_date || null,
            plaidPostedDate: transaction.date,
          },
        });

        modified++;
      }
    }

    // Process removed transactions
    for (const removedTx of data.removed as RemovedTransaction[]) {
      if (removedTx.transaction_id) {
        const existing = await db.transaction.findFirst({
          where: { plaidTransactionId: removedTx.transaction_id },
        });

        if (existing) {
          await db.transaction.delete({
            where: { id: existing.id },
          });

          removed++;
        }
      }
    }

    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  // Update cursor and last synced timestamp
  await db.plaidItem.update({
    where: { id: plaidItem.id },
    data: {
      cursor,
      lastSyncedAt: new Date().toISOString(),
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/tagger");
  revalidatePath("/");

  return { added, modified, removed, itemId: plaidItem.id };
}

// Sync all connected institutions
export async function syncAllTransactions(): Promise<SyncResult[]> {
  const plaidItems = await db.plaidItem.findMany();
  const results: SyncResult[] = [];

  for (const item of plaidItems) {
    try {
      const result = await syncTransactionsForItem(item.id);
      results.push(result);
    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error);
      // Continue with other items even if one fails
    }
  }

  return results;
}

// Refresh historical data - clears cursor and re-fetches all transactions
// Use this when initial sync didn't get all historical data (common with Chase)
export async function refreshHistoricalData(plaidItemId: string): Promise<SyncResult> {
  // Clear the cursor to force a fresh historical sync
  await db.plaidItem.update({
    where: { id: plaidItemId },
    data: { cursor: null },
  });

  // Now sync - this will use initialHistoricalSync since cursor is null
  return await syncTransactionsForItem(plaidItemId);
}

// Check if any items need syncing (last synced > 1 hour ago)
export async function getItemsNeedingSync(): Promise<string[]> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const items = await db.plaidItem.findMany({
    where: {
      OR: [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: oneHourAgo } },
      ],
    },
    select: { id: true },
  });

  return items.map(item => item.id);
}

// Disconnect an institution
export async function disconnectInstitution(
  plaidItemId: string,
  deleteTransactions: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const plaidItem = await db.plaidItem.findUnique({
      where: { id: plaidItemId },
      include: { accounts: true },
    });

    if (!plaidItem) {
      return { success: false, error: "Institution not found" };
    }

    // Remove the item from Plaid - THIS IS CRITICAL FOR BILLING
    try {
      await plaidClient.itemRemove({
        access_token: plaidItem.accessToken,
      });
      console.log(`✅ Successfully removed Plaid item: ${plaidItem.institutionName} (${plaidItemId})`);
    } catch (error) {
      // Log the error but continue with local cleanup
      console.error(`⚠️ WARNING: Failed to remove Plaid item ${plaidItemId} from Plaid's servers.`);
      console.error(`   Institution: ${plaidItem.institutionName}`);
      console.error(`   You may still be billed for this item!`);
      console.error(`   Check dashboard.plaid.com to manually remove it.`);
      console.error(`   Error:`, error);
    }

    if (deleteTransactions) {
      // Delete all transactions for accounts linked to this item
      for (const account of plaidItem.accounts) {
        await db.transaction.deleteMany({
          where: { accountId: account.id },
        });
      }
    } else {
      // Just unlink accounts from Plaid (keep transactions)
      for (const account of plaidItem.accounts) {
        await db.account.update({
          where: { id: account.id },
          data: {
            plaidItemId: null,
            plaidAccountId: null,
          },
        });
      }
    }

    // Delete the PlaidItem (this will cascade delete linked accounts if deleteTransactions is true)
    if (deleteTransactions) {
      await db.plaidItem.delete({
        where: { id: plaidItemId },
      });
    } else {
      // Just delete the PlaidItem, accounts are already unlinked
      await db.plaidItem.delete({
        where: { id: plaidItemId },
      });
    }

    revalidatePath("/accounts");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error) {
    console.error("Error disconnecting institution:", error);
    return { success: false, error: "Failed to disconnect institution" };
  }
}

// Check the status of all Plaid items (useful for debugging/billing verification)
export async function checkAllPlaidItemsStatus(): Promise<{
  items: Array<{
    id: string;
    institutionName: string;
    status: "active" | "error" | "removed";
    error?: string;
    accountCount?: number;
  }>;
}> {
  const plaidItems = await db.plaidItem.findMany();
  const results: Array<{
    id: string;
    institutionName: string;
    status: "active" | "error" | "removed";
    error?: string;
    accountCount?: number;
  }> = [];

  for (const item of plaidItems) {
    try {
      // Try to get item info from Plaid
      const response = await plaidClient.itemGet({
        access_token: item.accessToken,
      });

      // Also get account count
      const accountsResponse = await plaidClient.accountsGet({
        access_token: item.accessToken,
      });

      results.push({
        id: item.id,
        institutionName: item.institutionName,
        status: "active",
        accountCount: accountsResponse.data.accounts.length,
      });
    } catch (error: unknown) {
      // Check if it's an ITEM_NOT_FOUND error (meaning it was properly removed)
      const plaidError = error as { response?: { data?: { error_code?: string; error_message?: string } } };
      if (plaidError.response?.data?.error_code === "ITEM_NOT_FOUND") {
        results.push({
          id: item.id,
          institutionName: item.institutionName,
          status: "removed",
          error: "Item was removed from Plaid but still exists in local DB",
        });
      } else {
        results.push({
          id: item.id,
          institutionName: item.institutionName,
          status: "error",
          error: plaidError.response?.data?.error_message || "Unknown error",
        });
      }
    }
  }

  return { items: results };
}

// Helper function to map Plaid account types to our account types
function mapPlaidAccountType(
  type: string,
  subtype: string | null | undefined
): string {
  if (type === "credit") {
    return "credit_card";
  }
  if (type === "depository") {
    return "checking";
  }
  if (type === "investment") {
    return "investment";
  }
  if (type === "loan") {
    return "loan";
  }
  // Default to checking for unknown types
  return "checking";
}

// Helper function to format account name with last 4 digits for easy identification
function formatPlaidAccountName(
  institutionName: string,
  accountName: string,
  mask: string | null | undefined
): string {
  // Include last 4 digits if available to distinguish between similar accounts
  if (mask) {
    return `${institutionName} - ${accountName} (...${mask})`;
  }
  return `${institutionName} - ${accountName}`;
}


