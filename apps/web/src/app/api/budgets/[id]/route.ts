import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/budgets/[id]
 * Delete a budget.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { effectiveUserId } = await getAuthContext();

  if (!effectiveUserId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Verify ownership via category
    const budget = await db.categoryBudget.findFirst({
      where: { id },
      include: { category: true },
    });

    if (!budget || budget.category.userId !== effectiveUserId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Budget not found" } },
        { status: 404 }
      );
    }

    await db.categoryBudget.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Budgets] Error deleting:", error);
    return NextResponse.json(
      { success: false, error: { code: "DELETE_FAILED", message: "Failed to delete budget" } },
      { status: 500 }
    );
  }
}
