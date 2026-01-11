import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * GET /api/transactions/unconfirmed
 * List unconfirmed transactions (for the tagger).
 * Query params:
 * - limit: Number of results (default: 50)
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 500);

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where: {
          userId: session.user.id,
          isConfirmed: false,
          excluded: false,
        },
        include: {
          category: true,
          account: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      db.transaction.count({
        where: {
          userId: session.user.id,
          isConfirmed: false,
          excluded: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      total,
    });
  } catch (error) {
    console.error("[Transactions] Error fetching unconfirmed:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch unconfirmed transactions" } },
      { status: 500 }
    );
  }
}
