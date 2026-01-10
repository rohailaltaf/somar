import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * POST /api/budgets
 * Create or update a budget for a category.
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
    const { categoryId, amount, startMonth } = body;

    if (!categoryId || amount === undefined || !startMonth) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "categoryId, amount, and startMonth are required" } },
        { status: 400 }
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

    // Upsert: delete existing budget for this month and create new one
    await db.categoryBudget.deleteMany({
      where: { categoryId, startMonth },
    });

    const budget = await db.categoryBudget.create({
      data: {
        categoryId,
        amount,
        startMonth,
      },
    });

    return NextResponse.json({ success: true, data: budget }, { status: 201 });
  } catch (error) {
    console.error("[Budgets] Error creating:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_FAILED", message: "Failed to create budget" } },
      { status: 500 }
    );
  }
}
