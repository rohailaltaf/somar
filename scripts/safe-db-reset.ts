/**
 * Safe Database Reset Script
 * 
 * This script properly disconnects all Plaid items BEFORE resetting the database.
 * This prevents orphaned Plaid items that you'd continue to be billed for.
 * 
 * Usage:
 *   npm run db:safe-reset        # For development
 *   npm run db:safe-reset:prod   # For production
 */

import { PrismaClient } from "@prisma/client";
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

async function disconnectAllPlaidItems() {
  console.log("\n🔍 Checking for Plaid items to disconnect...\n");

  const plaidItems = await db.plaidItem.findMany();

  if (plaidItems.length === 0) {
    console.log("✅ No Plaid items found. Database is safe to reset.\n");
    return { success: true, disconnected: 0, failed: 0 };
  }

  console.log(`Found ${plaidItems.length} Plaid item(s) to disconnect:\n`);

  let disconnected = 0;
  let failed = 0;
  const failures: Array<{ institution: string; id: string; error: string }> = [];

  for (const item of plaidItems) {
    process.stdout.write(`  • ${item.institutionName}... `);

    try {
      await plaidClient.itemRemove({
        access_token: item.accessToken,
      });
      console.log("✅ Disconnected");
      disconnected++;
    } catch (error: unknown) {
      const plaidError = error as { response?: { data?: { error_code?: string } } };
      
      // ITEM_NOT_FOUND means it's already removed - that's fine
      if (plaidError.response?.data?.error_code === "ITEM_NOT_FOUND") {
        console.log("✅ Already removed");
        disconnected++;
      } else {
        console.log("❌ Failed");
        failed++;
        failures.push({
          institution: item.institutionName,
          id: item.id,
          error: plaidError.response?.data?.error_code || "Unknown error",
        });
      }
    }
  }

  console.log(`\n📊 Summary: ${disconnected} disconnected, ${failed} failed\n`);

  if (failures.length > 0) {
    console.log("⚠️  FAILED DISCONNECTIONS:");
    console.log("   These items may still be active on Plaid and you may be billed!");
    console.log("   Please remove them manually at dashboard.plaid.com\n");
    for (const f of failures) {
      console.log(`   • ${f.institution} (ID: ${f.id}) - Error: ${f.error}`);
    }
    console.log("");
  }

  return { success: failed === 0, disconnected, failed };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           SAFE DATABASE RESET                                 ║");
  console.log("║   This will disconnect all Plaid items before reset          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const env = process.env.NODE_ENV || "development";
  const dbFile = env === "production" ? "finance-prod.db" : "finance-dev.db";
  
  console.log(`\n📁 Environment: ${env}`);
  console.log(`📁 Database: ${dbFile}\n`);

  // Step 1: Disconnect all Plaid items
  const result = await disconnectAllPlaidItems();

  if (!result.success) {
    console.log("⚠️  Some Plaid items failed to disconnect.");
    console.log("   The database reset will continue, but you should check");
    console.log("   dashboard.plaid.com to ensure you're not being billed");
    console.log("   for orphaned items.\n");
  }

  // Step 2: Provide instructions for completing the reset
  console.log("✅ Plaid items processed. Now run:");
  console.log(`   npm run db:reset${env === "production" ? ":prod" : ""}\n`);

  await db.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});



