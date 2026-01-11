import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import type { AccountType, PlaidAccountInfo } from "@somar/shared";

// Initialize Plaid client configuration
const configuration = new Configuration({
  basePath:
    PlaidEnvironments[
      (process.env.PLAID_ENV as keyof typeof PlaidEnvironments) || "sandbox"
    ],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
    },
  },
});

// Export the Plaid client instance
export const plaidClient = new PlaidApi(configuration);

// Plaid product types we're requesting
export const PLAID_PRODUCTS = ["transactions"] as const;

// Countries we support
export const PLAID_COUNTRY_CODES = ["US"] as const;

// Helper to check if Plaid is configured
export function isPlaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

// Helper function to map Plaid account types to our account types
export function mapPlaidAccountType(
  plaidType: string,
  subtype?: string | null
): AccountType {
  if (plaidType === "credit") return "credit_card";
  if (plaidType === "depository") {
    if (subtype === "savings") return "savings";
    return "checking";
  }
  if (plaidType === "investment") return "investment";
  if (plaidType === "loan") return "loan";
  return "checking";
}

// Create a link token for Plaid Link
export async function createLinkToken(userId: string): Promise<{ linkToken: string } | { error: string }> {
  if (!isPlaidConfigured()) {
    return { error: "Plaid is not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables." };
  }

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
  userId: string,
  plaidItemId: string
): Promise<{ linkToken: string } | { error: string }> {
  if (!isPlaidConfigured()) {
    return { error: "Plaid is not configured" };
  }

  // Get the existing item (exclude soft-deleted)
  const item = await db.plaidItem.findFirst({
    where: { id: plaidItemId, userId, deletedAt: null },
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

// Exchange public token for access token and create accounts
export async function exchangePublicToken(
  userId: string,
  publicToken: string,
  institutionId: string,
  institutionName: string
): Promise<{ success: true; itemId: string; accounts: PlaidAccountInfo[] } | { success: false; error: string }> {
  if (!isPlaidConfigured()) {
    return { success: false, error: "Plaid is not configured" };
  }

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
          subtype: account.subtype,
        },
      });

      // Add to client response with mapped type
      accountsForClient.push({
        plaidAccountId: account.account_id,
        name: `${institutionName} - ${account.name}`,
        type: mapPlaidAccountType(account.type, account.subtype),
      });
    }

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

// Check status of all Plaid items (useful for debugging and billing verification)
export async function checkAllPlaidItemsStatus(userId: string): Promise<{
  items: Array<{
    id: string;
    institutionName: string;
    status: "active" | "removed" | "error";
    errorCode?: string;
  }>;
}> {
  const plaidItems = await db.plaidItem.findMany({
    where: { userId, deletedAt: null },
  });

  const results = await Promise.all(
    plaidItems.map(async (item) => {
      try {
        await plaidClient.itemGet({ access_token: item.accessToken });
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





