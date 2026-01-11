import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { serializeTransaction } from "@/lib/serializers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/transactions/[id]/toggle-excluded
 * Toggle the excluded status of a transaction.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Verify ownership and get current state
    const transaction = await db.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Transaction not found" } },
        { status: 404 }
      );
    }

    // Toggle excluded status
    const updated = await db.transaction.update({
      where: { id },
      data: { excluded: !transaction.excluded },
      include: { category: true, account: true },
    });

    return NextResponse.json({ success: true, data: serializeTransaction(updated) });
  } catch (error) {
    console.error("[Transactions] Error toggling excluded:", error);
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_FAILED", message: "Failed to toggle excluded" } },
      { status: 500 }
    );
  }
}
