/**
 * Safe Database Reset Script
 * 
 * This script properly disconnects all Plaid items BEFORE resetting the database.
 * This prevents orphaned Plaid items that you'd continue to be billed for.
 * 
 * Steps:
 * 1. Disconnects all Plaid items from Plaid API
 * 2. Deletes the central database file
 * 3. Recreates schema with Prisma
 * 
 * Usage:
 *   pnpm --filter web db:safe-reset       # For development
 *   pnpm --filter web db:safe-reset:prod  # For production
 */

import { PrismaClient } from ".prisma/central-client";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

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
  console.log("\n🔍 Step 1: Checking for Plaid items to disconnect...\n");

  const plaidItems = await db.plaidItem.findMany();

  if (plaidItems.length === 0) {
    console.log("✅ No Plaid items found.\n");
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

  console.log(`\n📊 Disconnect Summary: ${disconnected} disconnected, ${failed} failed\n`);

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

async function resetDatabase() {
  console.log("🗑️  Step 2: Deleting database...\n");

  await db.$disconnect();

  // Get database path from environment
  const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "finance.db";
  const fullDbPath = path.resolve(dbPath);

  // Delete database files
  const filesToDelete = [
    fullDbPath,
    `${fullDbPath}-wal`,
    `${fullDbPath}-shm`,
  ];

  for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`  ✅ Deleted: ${path.basename(file)}`);
    }
  }

  console.log("\n📦 Step 3: Creating fresh schema...\n");

  try {
    execSync("prisma db push --schema=prisma/central-schema.prisma --skip-generate", {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("❌ Failed to create schema");
    throw error;
  }

  console.log("✅ Schema recreated successfully\n");
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║              SAFE DATABASE RESET                              ║");
  console.log("║   Disconnects Plaid items, then resets the database          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const env = process.env.NODE_ENV || "development";
  const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "finance.db";
  console.log(`\n📁 Environment: ${env}`);
  console.log(`💾 Database: ${dbPath}\n`);

  // Step 1: Disconnect all Plaid items
  const result = await disconnectAllPlaidItems();

  if (!result.success) {
    console.log("⚠️  Some Plaid items failed to disconnect.");
    console.log("   Continuing with reset, but check dashboard.plaid.com");
    console.log("   to ensure you're not being billed for orphaned items.\n");
  }

  // Step 2-3: Reset database
  await resetDatabase();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    RESET COMPLETE                             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

