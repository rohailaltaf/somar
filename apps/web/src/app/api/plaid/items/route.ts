import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import type { AccountType, PlaidItemWithAccounts } from "@somar/shared";

/**
 * GET /api/plaid/items
 *
 * List all connected Plaid institutions for the current user.
 */

interface PlaidItemsResponse {
  success: boolean;
  data?: PlaidItemWithAccounts[];
  error?: {
    code: string;
    message: string;
  };
}

export async function GET(): Promise<NextResponse<PlaidItemsResponse>> {
  const { effectiveUserId } = await getAuthContext();

  if (!effectiveUserId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  try {
    const items = await db.plaidItem.findMany({
      where: { userId: effectiveUserId, deletedAt: null },
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

    const data: PlaidItemWithAccounts[] = items.map((item) => ({
      id: item.id,
      institutionId: item.institutionId,
      institutionName: item.institutionName,
      lastSyncedAt: item.lastSyncedAt?.toISOString() ?? null,
      accounts: item.plaidAccounts.map((acc) => ({
        id: acc.id,
        plaidAccountId: acc.plaidAccountId,
        name: acc.name,
        type: acc.type as AccountType,
      })),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Plaid Items] Error fetching items:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch Plaid items" } },
      { status: 500 }
    );
  }
}
