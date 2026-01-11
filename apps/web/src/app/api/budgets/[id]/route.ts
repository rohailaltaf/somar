import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/budgets/[id]
 * Delete a budget.
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
    // Verify ownership via category
    const budget = await db.categoryBudget.findFirst({
      where: { id },
      include: { category: true },
    });

    if (!budget || budget.category.userId !== session.user.id) {
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
