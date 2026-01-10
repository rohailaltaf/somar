/**
 * Get a specific Plaid transaction by ID
 * Usage: ACCESS_TOKEN=xxx TRANSACTION_ID=xxx pnpm exec tsx scripts/get-plaid-transaction.ts
 */

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const TRANSACTION_ID = process.env.TRANSACTION_ID;
const START_DATE = process.env.START_DATE || "2024-01-01";
const END_DATE = process.env.END_DATE || "2025-12-31";

async function main() {
  if (!ACCESS_TOKEN || !TRANSACTION_ID) {
    console.error("ACCESS_TOKEN and TRANSACTION_ID required");
    process.exit(1);
  }

  const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "production"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  });

  const client = new PlaidApi(config);

  let offset = 0;
  const count = 500;
  
  while (true) {
    const response = await client.transactionsGet({
      access_token: ACCESS_TOKEN,
      start_date: START_DATE,
      end_date: END_DATE,
      options: {
        count,
        offset,
      },
    });

    const transaction = response.data.transactions.find(
      (t) => t.transaction_id === TRANSACTION_ID
    );

    if (transaction) {
      console.log(JSON.stringify(transaction, null, 2));
      return;
    }

    offset += count;
    if (offset >= response.data.total_transactions) {
      console.log(`Transaction ${TRANSACTION_ID} not found`);
      console.log(`Searched ${response.data.total_transactions} total transactions`);
      return;
    }
  }
}

main().catch(console.error);
