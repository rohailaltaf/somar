/**
 * List All Plaid Items
 * 
 * This script checks all items in the CENTRAL database and verifies
 * their status with Plaid's API.
 * 
 * Note: This can only check items that are in your database.
 * If you deleted items without disconnecting, those orphaned items
 * won't show up here - you need to check Plaid's Billing page.
 * 
 * Usage:
 *   pnpm --filter web plaid:status       # Development
 *   pnpm --filter web plaid:status:prod  # Production
 */

import { PrismaClient } from ".prisma/central-client";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const db = new PrismaClient();

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[(process.env.PLAID_ENV as keyof typeof PlaidEnvironments) || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
    },
  },
});
const plaidClient = new PlaidApi(configuration);

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    PLAID ITEMS STATUS                         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const env = process.env.PLAID_ENV || "sandbox";
  console.log(`📡 Plaid Environment: ${env}\n`);

  const plaidItems = await db.plaidItem.findMany({
    include: { plaidAccounts: true },
  });

  if (plaidItems.length === 0) {
    console.log("📭 No Plaid items found in your local database.\n");
    console.log("If you believe you have active connections, check:");
    console.log("  1. Plaid Dashboard → Billing → Usage");
    console.log("  2. Plaid Dashboard → Logs (filter by 'item/create')");
    console.log("");
    await db.$disconnect();
    return;
  }

  console.log(`Found ${plaidItems.length} item(s) in local database:\n`);
  console.log("─".repeat(70));

  for (const item of plaidItems) {
    const deletedMarker = item.deletedAt ? " [SOFT DELETED]" : "";
    console.log(`\n📦 ${item.institutionName}${deletedMarker}`);
    console.log(`   Local ID: ${item.id}`);
    console.log(`   Created: ${item.createdAt}`);
    console.log(`   Last Synced: ${item.lastSyncedAt || "Never"}`);
    if (item.deletedAt) {
      console.log(`   Deleted At: ${item.deletedAt}`);
    }
    console.log(`   Local Accounts: ${item.plaidAccounts.length}`);
    
    // Check status with Plaid
    try {
      const response = await plaidClient.itemGet({
        access_token: item.accessToken,
      });
      
      const plaidItem = response.data.item;
      console.log(`   Plaid Status: ✅ ACTIVE`);
      console.log(`   Plaid Item ID: ${plaidItem.item_id}`);
      console.log(`   Available Products: ${plaidItem.available_products?.join(", ") || "N/A"}`);
      console.log(`   Billed Products: ${plaidItem.billed_products?.join(", ") || "N/A"}`);
      
      // Get accounts from Plaid
      const accountsResponse = await plaidClient.accountsGet({
        access_token: item.accessToken,
      });
      console.log(`   Plaid Accounts: ${accountsResponse.data.accounts.length}`);
      
      for (const acc of accountsResponse.data.accounts) {
        console.log(`      • ${acc.name} (${acc.type})`);
      }
    } catch (error: unknown) {
      const plaidError = error as { response?: { data?: { error_code?: string; error_message?: string } } };
      
      if (plaidError.response?.data?.error_code === "ITEM_NOT_FOUND") {
        console.log(`   Plaid Status: ⚪ REMOVED (not found on Plaid)`);
        console.log(`   Note: This item exists locally but was removed from Plaid.`);
        console.log(`         You can safely delete it from your database.`);
      } else if (plaidError.response?.data?.error_code === "ITEM_LOGIN_REQUIRED") {
        console.log(`   Plaid Status: ⚠️ LOGIN REQUIRED`);
        console.log(`   Note: User needs to re-authenticate. Item is still active/billed.`);
      } else {
        console.log(`   Plaid Status: ❌ ERROR`);
        console.log(`   Error: ${plaidError.response?.data?.error_message || "Unknown"}`);
      }
    }
  }

  console.log("\n" + "─".repeat(70));
  console.log("\n💡 To check for ORPHANED items (not in your DB but still on Plaid):");
  console.log("   Go to: dashboard.plaid.com → Billing → Usage\n");

  await db.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});




