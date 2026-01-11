import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { extractMerchantPattern } from "@somar/shared/services";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/transactions/[id]/confirm
 * Confirm a transaction with a category.
 * This also:
 * 1. Learns the merchant pattern
 * 2. Auto-tags other unconfirmed transactions with the same pattern
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
    const body = await request.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "categoryId is required" } },
        { status: 400 }
      );
    }

    // Verify transaction ownership
    const transaction = await db.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Transaction not found" } },
        { status: 404 }
      );
    }

    // Verify category ownership
    const category = await db.category.findFirst({
      where: { id: categoryId, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found" } },
        { status: 404 }
      );
    }

    // Update the transaction
    await db.transaction.update({
      where: { id },
      data: { categoryId, isConfirmed: true },
    });

    // Extract merchant pattern and learn it
    const pattern = extractMerchantPattern(transaction.description);
    let autoTaggedCount = 0;

    if (pattern) {
      // Upsert the categorization rule
      const existingRule = await db.categorizationRule.findFirst({
        where: { userId: session.user.id, pattern },
      });

      if (existingRule) {
        await db.categorizationRule.update({
          where: { id: existingRule.id },
          data: { categoryId },
        });
      } else {
        await db.categorizationRule.create({
          data: {
            userId: session.user.id,
            pattern,
            categoryId,
            isPreset: false,
          },
        });
      }

      // Auto-tag other unconfirmed transactions with the same pattern
      const result = await db.transaction.updateMany({
        where: {
          userId: session.user.id,
          isConfirmed: false,
          description: { contains: pattern, mode: "insensitive" },
          id: { not: id }, // Don't count the current transaction
        },
        data: { categoryId },
      });

      autoTaggedCount = result.count;
    }

    return NextResponse.json({
      success: true,
      data: { autoTaggedCount },
    });
  } catch (error) {
    console.error("[Transactions] Error confirming:", error);
    return NextResponse.json(
      { success: false, error: { code: "CONFIRM_FAILED", message: "Failed to confirm transaction" } },
      { status: 500 }
    );
  }
}
