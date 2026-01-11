import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { toDateField, toDateFieldNullable, serializeTransactions } from "@/lib/date-helpers";

/**
 * GET /api/transactions
 * List transactions with filtering and pagination.
 * Query params:
 * - accountId: Filter by account
 * - categoryId: Filter by category (use "null" for uncategorized)
 * - startDate: Filter by date >= startDate (YYYY-MM-DD)
 * - endDate: Filter by date <= endDate (YYYY-MM-DD)
 * - showExcluded: Include excluded transactions (default: false)
 * - search: Search in description
 * - limit: Number of results (default: 50)
 * - offset: Offset for pagination (default: 0)
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
    const accountId = url.searchParams.get("accountId");
    const categoryId = url.searchParams.get("categoryId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const showExcluded = url.searchParams.get("showExcluded") === "true";
    const search = url.searchParams.get("search");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const where = {
      userId: session.user.id,
      ...(accountId && { accountId }),
      ...(categoryId === "null" ? { categoryId: null } : categoryId ? { categoryId } : {}),
      ...(startDate && { date: { gte: toDateField(startDate) } }),
      ...(endDate && { date: { ...(startDate ? { gte: toDateField(startDate) } : {}), lte: toDateField(endDate) } }),
      ...(!showExcluded && { excluded: false }),
      ...(search && { description: { contains: search, mode: "insensitive" as const } }),
    };

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          category: true,
          account: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: serializeTransactions(transactions),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + transactions.length < total,
      },
    });
  } catch (error) {
    console.error("[Transactions] Error fetching:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch transactions" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Create one or more transactions.
 * Body: single transaction or array of transactions
 */
export async function POST(request: Request) {
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
    const body = await request.json();
    const transactions = Array.isArray(body) ? body : [body];

    // Validate required fields
    for (const txn of transactions) {
      if (!txn.accountId || !txn.description || txn.amount === undefined || !txn.date) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_INPUT", message: "accountId, description, amount, and date are required" } },
          { status: 400 }
        );
      }
    }

    // Verify account ownership for all accounts
    const accountIds = [...new Set(transactions.map((t) => t.accountId))];
    const accounts = await db.financeAccount.findMany({
      where: { id: { in: accountIds }, userId: session.user.id },
    });

    if (accounts.length !== accountIds.length) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ACCOUNT", message: "One or more accounts not found" } },
        { status: 400 }
      );
    }

    // Verify category ownership for all categories (if provided)
    const categoryIds = [...new Set(transactions.map((t) => t.categoryId).filter(Boolean))];
    if (categoryIds.length > 0) {
      const categories = await db.category.findMany({
        where: { id: { in: categoryIds }, userId: session.user.id },
      });

      if (categories.length !== categoryIds.length) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_CATEGORY", message: "One or more categories not found" } },
          { status: 400 }
        );
      }
    }

    // Create transactions
    const created = await db.transaction.createMany({
      data: transactions.map((txn) => ({
        userId: session.user.id,
        accountId: txn.accountId,
        categoryId: txn.categoryId || null,
        description: txn.description,
        amount: txn.amount,
        date: toDateField(txn.date),
        excluded: txn.excluded || false,
        isConfirmed: txn.isConfirmed || false,
        plaidTransactionId: txn.plaidTransactionId || null,
        plaidOriginalDescription: txn.plaidOriginalDescription || null,
        plaidName: txn.plaidName || null,
        plaidMerchantName: txn.plaidMerchantName || null,
        plaidAuthorizedDate: toDateFieldNullable(txn.plaidAuthorizedDate),
        plaidPostedDate: toDateFieldNullable(txn.plaidPostedDate),
      })),
    });

    return NextResponse.json({ success: true, data: { count: created.count } }, { status: 201 });
  } catch (error) {
    // Check for unique constraint violation (duplicate plaid transaction)
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE", message: "Duplicate transaction" } },
        { status: 409 }
      );
    }
    console.error("[Transactions] Error creating:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_FAILED", message: "Failed to create transactions" } },
      { status: 500 }
    );
  }
}
