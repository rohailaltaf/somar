import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/categories/[id]
 * Get a single category.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { effectiveUserId } = await getAuthContext();

  if (!effectiveUserId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const category = await db.category.findFirst({
      where: { id, userId: effectiveUserId },
      include: { budgets: true },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("[Categories] Error fetching:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch category" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/categories/[id]
 * Update a category.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { effectiveUserId } = await getAuthContext();

  if (!effectiveUserId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Verify ownership
    const existing = await db.category.findFirst({
      where: { id, userId: effectiveUserId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, type, color } = body;

    const category = await db.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(color && { color }),
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE", message: "Category with this name already exists" } },
        { status: 409 }
      );
    }
    console.error("[Categories] Error updating:", error);
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_FAILED", message: "Failed to update category" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category.
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
    // Verify ownership
    const existing = await db.category.findFirst({
      where: { id, userId: effectiveUserId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found" } },
        { status: 404 }
      );
    }

    await db.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Categories] Error deleting:", error);
    return NextResponse.json(
      { success: false, error: { code: "DELETE_FAILED", message: "Failed to delete category" } },
      { status: 500 }
    );
  }
}
