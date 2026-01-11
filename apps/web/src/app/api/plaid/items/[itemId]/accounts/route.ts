import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/plaid/items/[itemId]/accounts
 *
 * Update/sync account list after user manages accounts in Plaid Link update mode.
 */

interface UpdateAccountsResponse {
  success: boolean;
  data?: {
    added: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse<UpdateAccountsResponse>> {
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

  const { itemId } = await params;

  if (!itemId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_ITEM_ID", message: "itemId is required" } },
      { status: 400 }
    );
  }

  // Get the item with existing accounts (exclude soft-deleted)
  const item = await db.plaidItem.findFirst({
    where: { id: itemId, userId: session.user.id, deletedAt: null },
    include: { plaidAccounts: true },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: { code: "ITEM_NOT_FOUND", message: "Plaid item not found" } },
      { status: 404 }
    );
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

    return NextResponse.json({
      success: true,
      data: {
        added,
        total: plaidAccounts.length,
      },
    });
  } catch (error) {
    console.error("[Plaid Update Accounts] Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_FAILED", message: "Failed to update accounts" } },
      { status: 500 }
    );
  }
}
