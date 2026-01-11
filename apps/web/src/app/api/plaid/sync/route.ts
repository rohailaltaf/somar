import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid";
import { headers } from "next/headers";
import type { Transaction as PlaidTransaction } from "plaid";
import { parseDate, parseDateNullable } from "@somar/shared/utils";

/**
 * POST /api/plaid/sync
 *
 * Sync transactions from Plaid and save directly to the database.
 * Cursor is stored server-side in the PlaidItem table.
 *
 * For initial sync (no cursor), uses retry logic with exponential backoff
 * to wait for Plaid to enrich transaction data (authorized_date, merchant_name).
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if transactions are enriched (have authorized_date).
 * Plaid needs time after initial connection to enrich transaction data.
 */
function areTransactionsEnriched(transactions: PlaidTransaction[]): boolean {
  const nonPendingTx = transactions.find((tx) => !tx.pending);
  return !!(nonPendingTx && nonPendingTx.authorized_date);
}

/**
 * Map Plaid account type to our account type.
 */
function mapPlaidAccountType(type: string, subtype?: string | null): string {
  if (type === "credit") return "credit_card";
  if (type === "depository") {
    if (subtype === "savings") return "savings";
    return "checking";
  }
  if (type === "investment") return "investment";
  if (type === "loan") return "loan";
  return "checking";
}

interface PlaidSyncRequest {
  plaidItemId: string;
}

interface PlaidSyncResponse {
  success: boolean;
  data?: {
    addedCount: number;
    modifiedCount: number;
    removedCount: number;
  };
  error?: {
    code: string;
    message: string;
    requiresReauth?: boolean;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<PlaidSyncResponse>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  if (!isPlaidConfigured()) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_CONFIGURED", message: "Plaid is not configured" } },
      { status: 500 }
    );
  }

  let body: PlaidSyncRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { plaidItemId } = body;

  if (!plaidItemId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_ITEM_ID", message: "plaidItemId is required" } },
      { status: 400 }
    );
  }

  // Get PlaidItem from central DB (verify ownership + get access token + cursor)
  const item = await db.plaidItem.findFirst({
    where: { id: plaidItemId, userId: session.user.id, deletedAt: null },
    include: { plaidAccounts: true },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: { code: "ITEM_NOT_FOUND", message: "Plaid item not found" } },
      { status: 404 }
    );
  }

  try {
    const isInitialSync = !item.cursor;
    // Client waits 20s before first sync, so fewer retries needed
    const maxRetries = isInitialSync ? 3 : 1;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const allAdded: PlaidTransaction[] = [];
        const allModified: PlaidTransaction[] = [];
        const allRemoved: Array<{ transaction_id: string }> = [];
        let hasMore = true;
        let currentCursor = item.cursor || undefined;

        while (hasMore) {
          const syncResponse = await plaidClient.transactionsSync({
            access_token: item.accessToken,
            cursor: currentCursor,
          });

          allAdded.push(...syncResponse.data.added);
          allModified.push(...syncResponse.data.modified);
          allRemoved.push(...syncResponse.data.removed);

          hasMore = syncResponse.data.has_more;
          currentCursor = syncResponse.data.next_cursor;
        }

        // For initial sync, retry if not enriched
        if (isInitialSync && attempt < maxRetries - 1) {
          const needsRetry = allAdded.length === 0 || !areTransactionsEnriched(allAdded);
          if (needsRetry) {
            const waitTime = Math.pow(2, attempt + 1) * 1000;
            await delay(waitTime);
            continue;
          }
        }

        // Build a map of plaid_account_id -> our FinanceAccount.id
        const plaidAccountMap = new Map<string, string>();

        // Ensure FinanceAccounts exist for each Plaid account
        for (const plaidAccount of item.plaidAccounts) {
          // Check if we already have a FinanceAccount for this Plaid account
          let financeAccount = await db.financeAccount.findFirst({
            where: {
              userId: session.user.id,
              plaidAccountId: plaidAccount.plaidAccountId,
            },
          });

          if (!financeAccount) {
            // Create new FinanceAccount
            financeAccount = await db.financeAccount.create({
              data: {
                userId: session.user.id,
                name: plaidAccount.name,
                type: mapPlaidAccountType(plaidAccount.type),
                plaidAccountId: plaidAccount.plaidAccountId,
              },
            });
          }

          plaidAccountMap.set(plaidAccount.plaidAccountId, financeAccount.id);
        }

        let addedCount = 0;
        let modifiedCount = 0;
        let removedCount = 0;

        // Batch check for existing transactions (added)
        const addedPlaidIds = allAdded.map((tx) => tx.transaction_id);
        const existingAdded = await db.transaction.findMany({
          where: { plaidTransactionId: { in: addedPlaidIds } },
          select: { plaidTransactionId: true },
        });
        const existingAddedIds = new Set(existingAdded.map((t) => t.plaidTransactionId));

        // Process added transactions
        for (const tx of allAdded) {
          const accountId = plaidAccountMap.get(tx.account_id);
          if (!accountId) continue;
          if (existingAddedIds.has(tx.transaction_id)) continue;

          await db.transaction.create({
            data: {
              userId: session.user.id,
              accountId,
              description: tx.merchant_name || tx.name || "Unknown",
              amount: -tx.amount, // Plaid uses positive for debits, we use negative for expenses
              date: parseDate(tx.authorized_date || tx.date),
              isConfirmed: false,
              excluded: false,
              plaidTransactionId: tx.transaction_id,
              plaidOriginalDescription: tx.original_description,
              plaidName: tx.name,
              plaidMerchantName: tx.merchant_name,
              plaidAuthorizedDate: parseDateNullable(tx.authorized_date),
              plaidPostedDate: parseDateNullable(tx.date),
            },
          });
          addedCount++;
        }

        // Batch fetch existing transactions (modified)
        const modifiedPlaidIds = allModified.map((tx) => tx.transaction_id);
        const existingModified = await db.transaction.findMany({
          where: { plaidTransactionId: { in: modifiedPlaidIds } },
          select: { id: true, plaidTransactionId: true, description: true },
        });
        const existingModifiedMap = new Map(
          existingModified.map((t) => [t.plaidTransactionId, t])
        );

        // Process modified transactions
        for (const tx of allModified) {
          const existing = existingModifiedMap.get(tx.transaction_id);
          if (!existing) continue;

          await db.transaction.update({
            where: { id: existing.id },
            data: {
              description: tx.merchant_name || tx.name || existing.description,
              amount: -tx.amount,
              date: parseDate(tx.authorized_date || tx.date),
              plaidMerchantName: tx.merchant_name,
              plaidAuthorizedDate: parseDateNullable(tx.authorized_date),
              plaidPostedDate: parseDateNullable(tx.date),
            },
          });
          modifiedCount++;
        }

        // Process removed transactions
        for (const removal of allRemoved) {
          const deleted = await db.transaction.deleteMany({
            where: {
              userId: session.user.id,
              plaidTransactionId: removal.transaction_id,
            },
          });
          removedCount += deleted.count;
        }

        // Update cursor and lastSyncedAt on PlaidItem
        await db.plaidItem.update({
          where: { id: plaidItemId },
          data: {
            cursor: currentCursor,
            lastSyncedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            addedCount,
            modifiedCount,
            removedCount,
          },
        });
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt + 1) * 1000;
          await delay(waitTime);
        }
      }
    }

    throw lastError;
  } catch (error: unknown) {
    const plaidError = error as {
      response?: {
        data?: {
          error_code?: string;
          error_message?: string;
        };
      };
    };

    const errorCode = plaidError?.response?.data?.error_code || "UNKNOWN_ERROR";
    const errorMessage = plaidError?.response?.data?.error_message || "Failed to sync transactions";

    const requiresReauth = [
      "ITEM_LOGIN_REQUIRED",
      "ITEM_LOCKED",
      "USER_PERMISSION_REVOKED",
    ].includes(errorCode);

    console.error(`[Plaid Sync] Error for item ${plaidItemId}:`, errorCode, errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          requiresReauth,
        },
      },
      { status: requiresReauth ? 401 : 500 }
    );
  }
}
