import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { parseDate } from "@somar/shared/utils";
import { serializeTransaction } from "@/lib/serializers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/transactions/[id]
 * Get a single transaction.
 */
export async function GET(request: Request, { params }: RouteParams) {
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
    const transaction = await db.transaction.findFirst({
      where: { id, userId: session.user.id },
      include: { category: true, account: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Transaction not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: serializeTransaction(transaction) });
  } catch (error) {
    console.error("[Transactions] Error fetching:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch transaction" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/transactions/[id]
 * Update a transaction.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
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
    // Verify ownership
    const existing = await db.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Transaction not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { categoryId, description, amount, date, excluded, isConfirmed } = body;

    // Verify category ownership (if categoryId is being updated)
    if (categoryId !== undefined && categoryId !== null) {
      const category = await db.category.findFirst({
        where: { id: categoryId, userId: session.user.id },
      });

      if (!category) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_CATEGORY", message: "Category not found" } },
          { status: 400 }
        );
      }
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: {
        ...(categoryId !== undefined && { categoryId }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount }),
        ...(date !== undefined && { date: parseDate(date) }),
        ...(excluded !== undefined && { excluded }),
        ...(isConfirmed !== undefined && { isConfirmed }),
      },
      include: { category: true, account: true },
    });

    return NextResponse.json({ success: true, data: serializeTransaction(transaction) });
  } catch (error) {
    console.error("[Transactions] Error updating:", error);
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_FAILED", message: "Failed to update transaction" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete a transaction.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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
    // Verify ownership
    const existing = await db.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Transaction not found" } },
        { status: 404 }
      );
    }

    await db.transaction.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Transactions] Error deleting:", error);
    return NextResponse.json(
      { success: false, error: { code: "DELETE_FAILED", message: "Failed to delete transaction" } },
      { status: 500 }
    );
  }
}
