"use server";

/**
 * Plaid Server Actions for E2EE
 * 
 * In E2EE mode, the server cannot write to user's encrypted database.
 * Instead:
 * 1. Plaid connection metadata is stored in central DB
 * 2. Synced transactions are queued as encrypted pending syncs
 * 3. Client fetches pending syncs, decrypts, and merges into their DB
 * 
 * NOTE: Full Plaid sync requires asymmetric encryption (user public key).
 * For now, this handles connection management only.
 * Transaction sync will be added when public key infrastructure is in place.
 */

import { db } from "@/lib/db";
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES, isPlaidConfigured } from "@/lib/plaid";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  Products,
  CountryCode,
} from "plaid";
import type { AccountType } from "@somar/shared";

// Types
export interface PlaidItemWithAccounts {
  id: string;
  institutionId: string;
  institutionName: string;
  lastSyncedAt: Date | null;
  accounts: {
    id: string;
    plaidAccountId: string;
    name: string;
    type: string;
  }[];
}

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

// Get all connected Plaid items for the current user
export async function getPlaidItems(): Promise<PlaidItemWithAccounts[]> {
  const userId = await getCurrentUserId();

  const items = await db.plaidItem.findMany({
    where: { userId },
    include: {
      plaidAccounts: {
        select: {
          id: true,
          plaidAccountId: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { institutionName: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    institutionId: item.institutionId,
    institutionName: item.institutionName,
    lastSyncedAt: item.lastSyncedAt,
    accounts: item.plaidAccounts.map((acc) => ({
      id: acc.id,
      plaidAccountId: acc.plaidAccountId,
      name: acc.name,
      type: acc.type,
    })),
  }));
}

// Create a link token for Plaid Link
export async function createLinkToken(): Promise<{ linkToken: string } | { error: string }> {
  if (!isPlaidConfigured()) {
    return { error: "Plaid is not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables." };
  }

  const userId = await getCurrentUserId();

  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: "Somar Finance",
      products: PLAID_PRODUCTS as unknown as Products[],
      country_codes: PLAID_COUNTRY_CODES as unknown as CountryCode[],
      language: "en",
      // Request up to 2 years (730 days) of transaction history
      transactions: {
        days_requested: 730,
      },
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
    return { error: "Plaid is not configured" };
  }

  const userId = await getCurrentUserId();

  // Get the existing item
  const item = await db.plaidItem.findFirst({
    where: { id: plaidItemId, userId },
  });

  if (!item) {
    return { error: "Plaid item not found" };
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: "Somar Finance",
      country_codes: PLAID_COUNTRY_CODES as unknown as CountryCode[],
      language: "en",
      access_token: item.accessToken,
    });

    return { linkToken: response.data.link_token };
  } catch (error) {
    console.error("Error creating update mode link token:", error);
    return { error: "Failed to create update link token" };
  }
}

// Account info returned to client for local DB creation
export interface PlaidAccountInfo {
  plaidAccountId: string;
  name: string;
  type: AccountType;
}

// Helper function to map Plaid account types to our account types
function mapPlaidAccountType(plaidType: string): AccountType {
  switch (plaidType) {
    case "credit":
      return "credit_card";
    case "investment":
      return "investment";
    case "loan":
      return "loan";
    case "depository":
    default:
      return "checking";
  }
}

// Exchange public token for access token and create accounts
export async function exchangePublicToken(
  publicToken: string,
  institutionId: string,
  institutionName: string
): Promise<{ success: true; itemId: string; accounts: PlaidAccountInfo[] } | { success: false; error: string }> {
  if (!isPlaidConfigured()) {
    return { success: false, error: "Plaid is not configured" };
  }

  const userId = await getCurrentUserId();

  try {
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;

    // Get accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Create PlaidItem in central database
    const plaidItem = await db.plaidItem.create({
      data: {
        id: uuidv4(),
        userId,
        accessToken,
        institutionId,
        institutionName,
      },
    });

    // Create PlaidAccountMeta entries and build response for client
    const accountsForClient: PlaidAccountInfo[] = [];
    
    for (const account of accountsResponse.data.accounts) {
      await db.plaidAccountMeta.create({
        data: {
          id: uuidv4(),
          plaidItemId: plaidItem.id,
          plaidAccountId: account.account_id,
          name: account.name,
          type: account.type,
        },
      });
      
      // Add to client response with mapped type
      accountsForClient.push({
        plaidAccountId: account.account_id,
        name: `${institutionName} - ${account.name}`,
        type: mapPlaidAccountType(account.type),
      });
    }

    revalidatePath("/accounts");
    revalidatePath("/");

    return { 
      success: true, 
      itemId: plaidItem.id, 
      accounts: accountsForClient,
    };
  } catch (error) {
    console.error("Error exchanging public token:", error);
    return { success: false, error: "Failed to connect account" };
  }
}

// Disconnect a Plaid institution
export async function disconnectInstitution(
  plaidItemId: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();

  const item = await db.plaidItem.findFirst({
    where: { id: plaidItemId, userId },
  });

  if (!item) {
    return { success: false, error: "Plaid item not found" };
  }

  try {
    // Remove from Plaid
    await plaidClient.itemRemove({
      access_token: item.accessToken,
    });
  } catch (error) {
    console.error("Error removing Plaid item:", error);
    // Continue anyway - delete from our DB even if Plaid call fails
  }

  // Delete from central database (cascades to PlaidAccountMeta)
  await db.plaidItem.delete({
    where: { id: plaidItemId },
  });

  revalidatePath("/accounts");
  revalidatePath("/");

  return { success: true };
}

// Update Plaid item accounts after user manages accounts in Plaid Link update mode
export async function updatePlaidItemAccounts(
  itemId: string
): Promise<{ success: boolean; added: number; total: number; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, added: 0, total: 0, error: "Not authenticated" };
  }

  if (!plaidClient) {
    return { success: false, added: 0, total: 0, error: "Plaid not configured" };
  }

  const item = await db.plaidItem.findUnique({
    where: { id: itemId, userId: session.user.id },
    include: { plaidAccounts: true },
  });

  if (!item) {
    return { success: false, added: 0, total: 0, error: "Item not found" };
  }

  try {
    // Get current accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: item.accessToken,
    });

    const plaidAccounts = accountsResponse.data.accounts;
    const existingPlaidAccountIds = item.plaidAccounts.map((a) => a.plaidAccountId);

    let added = 0;

    for (const account of plaidAccounts) {
      if (!existingPlaidAccountIds.includes(account.account_id)) {
        // New account - add to metadata
        await db.plaidAccountMeta.create({
          data: {
            id: uuidv4(),
            plaidItemId: itemId,
            plaidAccountId: account.account_id,
            name: account.name,
            type: account.type,
          },
        });
        added++;
      }
    }

    return {
      success: true,
      added,
      total: plaidAccounts.length,
    };
  } catch (error) {
    console.error("[Plaid] Error updating accounts:", error);
    return { success: false, added: 0, total: 0, error: "Failed to update accounts" };
  }
}

// Check status of all Plaid items (useful for debugging and billing verification)
export async function checkAllPlaidItemsStatus(): Promise<{
  items: Array<{
    id: string;
    institutionName: string;
    status: "active" | "removed" | "error";
    errorCode?: string;
  }>;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { items: [] };
  }

  if (!plaidClient) {
    return { items: [] };
  }

  const plaidItems = await db.plaidItem.findMany({
    where: { userId: session.user.id },
  });

  const results = await Promise.all(
    plaidItems.map(async (item) => {
      try {
        await plaidClient!.itemGet({ access_token: item.accessToken });
        return {
          id: item.id,
          institutionName: item.institutionName,
          status: "active" as const,
        };
      } catch (error: unknown) {
        const plaidError = error as { response?: { data?: { error_code?: string } } };
        const errorCode = plaidError?.response?.data?.error_code;

        return {
          id: item.id,
          institutionName: item.institutionName,
          status: errorCode === "ITEM_NOT_FOUND" ? ("removed" as const) : ("error" as const),
          errorCode,
        };
      }
    })
  );

  return { items: results };
}
