import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid";
import { headers } from "next/headers";
import type { Transaction as PlaidTransaction } from "plaid";

/**
 * POST /api/plaid/sync
 *
 * Server proxy for Plaid transactionsSync API.
 * Client sends cursor (from encrypted DB), server returns raw transactions.
 * Cursor is NOT stored on server - client owns cursor for data integrity.
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
  // Find first non-pending transaction
  const nonPendingTx = transactions.find((tx) => !tx.pending);
  // Check if it has authorized_date (indicates enrichment is complete)
  return !!(nonPendingTx && nonPendingTx.authorized_date);
}

interface PlaidSyncRequest {
  plaidItemId: string;
  cursor?: string; // From client's encrypted DB, empty/undefined for initial sync
}

interface PlaidSyncResponse {
  success: boolean;
  data?: {
    added: PlaidTransaction[];
    modified: PlaidTransaction[];
    removed: Array<{ transaction_id: string }>;
    nextCursor: string;
  };
  error?: {
    code: string;
    message: string;
    requiresReauth?: boolean;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<PlaidSyncResponse>> {
  // Validate session
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

  // Parse request body
  let body: PlaidSyncRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { plaidItemId, cursor } = body;

  if (!plaidItemId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_ITEM_ID", message: "plaidItemId is required" } },
      { status: 400 }
    );
  }

  // Get PlaidItem from central DB (verify ownership + get access token)
  const item = await db.plaidItem.findFirst({
    where: { id: plaidItemId, userId: session.user.id },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: { code: "ITEM_NOT_FOUND", message: "Plaid item not found" } },
      { status: 404 }
    );
  }

  try {
    const isInitialSync = !cursor;
    const maxRetries = isInitialSync ? 8 : 1; // Retry only for initial sync
    let lastError: unknown = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Call Plaid transactionsSync API
        const allAdded: PlaidTransaction[] = [];
        const allModified: PlaidTransaction[] = [];
        const allRemoved: Array<{ transaction_id: string }> = [];
        let hasMore = true;
        let currentCursor = cursor || undefined;

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

        // For initial sync, retry if:
        // 1. No transactions returned (Plaid hasn't fetched from bank yet)
        // 2. Transactions returned but not enriched (missing authorized_date)
        if (isInitialSync && attempt < maxRetries - 1) {
          const needsRetry = allAdded.length === 0 || !areTransactionsEnriched(allAdded);
          if (needsRetry) {
            const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s
            const reason = allAdded.length === 0 ? "no transactions yet" : "data not enriched";
            console.log(`[Plaid Sync] Attempt ${attempt + 1}: ${reason}, waiting ${waitTime / 1000}s...`);
            await delay(waitTime);
            continue; // Retry
          }
        }

        if (isInitialSync && allAdded.length === 0) {
          console.log(`[Plaid Sync] Max retries reached with no transactions`);
        }

        // Update only lastSyncedAt on server (cursor is client-side)
        await db.plaidItem.update({
          where: { id: plaidItemId },
          data: { lastSyncedAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          data: {
            added: allAdded,
            modified: allModified,
            removed: allRemoved,
            nextCursor: currentCursor!,
          },
        });
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt + 1) * 1000;
          console.log(`[Plaid Sync] Attempt ${attempt + 1} failed, waiting ${waitTime / 1000}s before retry...`);
          await delay(waitTime);
        }
      }
    }

    // All retries failed - throw the last error
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

    // Check if this is an error that requires re-authentication
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
