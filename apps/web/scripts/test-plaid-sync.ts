/**
 * Test script to see how much data we get back from Plaid.
 *
 * Usage:
 *   pnpm --filter web tsx scripts/test-plaid-sync.ts [itemId]
 */

import { PrismaClient } from ".prisma/central-client";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import * as dotenv from "dotenv";

// Load environment
dotenv.config({ path: ".env.development" });

const db = new PrismaClient();

const plaidClient = new PlaidApi(
  new Configuration({
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
  })
);

async function main() {
  const itemId = process.argv[2];

  console.log("\n🔍 Plaid Sync Test Script\n");
  console.log("Environment:", process.env.PLAID_ENV || "sandbox");
  console.log(
    "Client ID:",
    process.env.PLAID_CLIENT_ID ? "✓ Set" : "✗ Missing"
  );
  console.log("Secret:", process.env.PLAID_SECRET ? "✓ Set" : "✗ Missing");

  // Get the specific item or all items (exclude soft-deleted)
  const items = itemId
    ? await db.plaidItem.findMany({
        where: { id: itemId, deletedAt: null },
        include: { plaidAccounts: true },
      })
    : await db.plaidItem.findMany({
        where: { deletedAt: null },
        include: { plaidAccounts: true },
      });

  if (items.length === 0) {
    console.log(
      "\n❌ No Plaid items found. Connect a bank account first via the UI.\n"
    );
    return;
  }

  console.log(`\n📋 Testing ${items.length} connected institution(s):\n`);

  for (const item of items) {
    console.log("─".repeat(70));
    console.log(`\n🏦 ${item.institutionName}`);
    console.log(`   Item ID: ${item.id}`);
    console.log(`   User ID: ${item.userId}`);
    console.log(`   Accounts: ${item.plaidAccounts.length}`);
    console.log(`   Last synced: ${item.lastSyncedAt || "Never"}`);
    console.log(`   Cursor: ${item.cursor || "None (initial sync needed)"}`);

    // List accounts
    console.log("\n   Linked accounts:");
    for (const acc of item.plaidAccounts) {
      console.log(`     - ${acc.name} (${acc.type})`);
    }

    // Test 1: Check item status
    console.log("\n   📡 Checking item status...");
    try {
      const itemStatus = await plaidClient.itemGet({
        access_token: item.accessToken,
      });
      console.log(`   ✓ Item is active`);
      console.log(
        `   Institution ID: ${itemStatus.data.item.institution_id}`
      );

      const txnStatus = itemStatus.data.status?.transactions;
      if (txnStatus) {
        console.log(
          `   Last successful update: ${txnStatus.last_successful_update || "N/A"}`
        );
        console.log(
          `   Last failed update: ${txnStatus.last_failed_update || "None"}`
        );
      }

      // Check for errors
      if (itemStatus.data.item.error) {
        console.log(`   ⚠️  Item Error: ${itemStatus.data.item.error.error_code}`);
        console.log(`      ${itemStatus.data.item.error.error_message}`);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error_code?: string; error_message?: string } } };
      console.log(`   ✗ Error checking item status`);
      console.log(`     Error code: ${err.response?.data?.error_code}`);
      console.log(`     Message: ${err.response?.data?.error_message}`);
      continue;
    }

    // Test 2: Get account balances
    console.log("\n   💰 Fetching account balances...");
    try {
      const balances = await plaidClient.accountsBalanceGet({
        access_token: item.accessToken,
      });

      for (const acc of balances.data.accounts) {
        console.log(`\n   Account: ${acc.name} (${acc.type}/${acc.subtype})`);
        console.log(`     Available: $${acc.balances.available?.toFixed(2) || "N/A"}`);
        console.log(`     Current: $${acc.balances.current?.toFixed(2) || "N/A"}`);
        console.log(`     Limit: $${acc.balances.limit?.toFixed(2) || "N/A"}`);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error_code?: string } } };
      console.log(`   ✗ Error fetching balances: ${err.response?.data?.error_code}`);
    }

    // Test 3: Sync transactions
    console.log("\n   📊 Syncing transactions...");
    try {
      let hasMore = true;
      let cursor = item.cursor || undefined;
      let totalAdded = 0;
      let totalModified = 0;
      let totalRemoved = 0;
      const allTransactions: Array<{
        date: string;
        name: string;
        amount: number;
        merchant_name: string | null;
      }> = [];

      while (hasMore) {
        const syncResponse = await plaidClient.transactionsSync({
          access_token: item.accessToken,
          cursor,
        });

        totalAdded += syncResponse.data.added.length;
        totalModified += syncResponse.data.modified.length;
        totalRemoved += syncResponse.data.removed.length;

        // Collect transactions for preview
        for (const txn of syncResponse.data.added) {
          allTransactions.push({
            date: txn.date,
            name: txn.name,
            amount: txn.amount,
            merchant_name: txn.merchant_name ?? null,
          });
        }

        hasMore = syncResponse.data.has_more;
        cursor = syncResponse.data.next_cursor;
      }

      console.log(`\n   ✓ Sync complete!`);
      console.log(`     New transactions: ${totalAdded}`);
      console.log(`     Modified: ${totalModified}`);
      console.log(`     Removed: ${totalRemoved}`);
      console.log(`     New cursor: ${cursor?.substring(0, 20)}...`);

      // Show sample transactions
      if (allTransactions.length > 0) {
        console.log(`\n   📝 Sample transactions (first 10):\n`);
        const sample = allTransactions.slice(0, 10);
        for (const txn of sample) {
          const amount = txn.amount < 0 ? `+$${Math.abs(txn.amount).toFixed(2)}` : `-$${txn.amount.toFixed(2)}`;
          const merchant = txn.merchant_name || txn.name;
          console.log(`     ${txn.date}  ${amount.padStart(10)}  ${merchant.substring(0, 40)}`);
        }
        
        if (allTransactions.length > 10) {
          console.log(`     ... and ${allTransactions.length - 10} more`);
        }
      }

      // Date range
      if (allTransactions.length > 0) {
        const dates = allTransactions.map((t) => t.date).sort();
        console.log(`\n   📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
      }

      // Ask if we should save the cursor
      console.log(`\n   💾 Would save cursor to DB for incremental syncs`);
      
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error_code?: string; error_message?: string } } };
      console.log(`   ✗ Error syncing transactions`);
      console.log(`     Error code: ${err.response?.data?.error_code}`);
      console.log(`     Message: ${err.response?.data?.error_message}`);
    }
  }

  console.log("\n" + "─".repeat(70));
  console.log("✅ Test complete!\n");
}

main()
  .catch((e) => {
    console.error("Script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

