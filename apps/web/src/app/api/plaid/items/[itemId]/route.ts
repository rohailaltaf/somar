import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plaidClient } from "@/lib/plaid";
import { headers } from "next/headers";

/**
 * DELETE /api/plaid/items/[itemId]
 *
 * Disconnect a Plaid institution.
 */

interface DisconnectResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse<DisconnectResponse>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { itemId } = await params;

  if (!itemId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_ITEM_ID", message: "itemId is required" } },
      { status: 400 }
    );
  }

  // Get the item and verify ownership
  const item = await db.plaidItem.findFirst({
    where: { id: itemId, userId: session.user.id },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: { code: "ITEM_NOT_FOUND", message: "Plaid item not found" } },
      { status: 404 }
    );
  }

  try {
    // Remove from Plaid first - if this fails, don't delete from our DB
    // otherwise we lose the access token and can never clean up the orphan
    await plaidClient.itemRemove({
      access_token: item.accessToken,
    });

    // Only delete from our DB after Plaid confirms removal
    await db.plaidItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const plaidError = error as { response?: { data?: { error_code?: string } } };
    const errorCode = plaidError?.response?.data?.error_code;

    // If Plaid says item doesn't exist, safe to delete from our DB
    if (errorCode === "ITEM_NOT_FOUND") {
      await db.plaidItem.delete({
        where: { id: itemId },
      });
      return NextResponse.json({ success: true });
    }

    console.error("[Plaid Disconnect] Error removing Plaid item:", error);
    return NextResponse.json(
      { success: false, error: { code: errorCode || "PLAID_ERROR", message: "Failed to disconnect from Plaid. Please try again." } },
      { status: 500 }
    );
  }
}
