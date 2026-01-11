import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * GET /api/categories
 * List all categories for the current user.
 * Query params:
 * - type: Filter by category type (spending, income, transfer)
 * - withBudgets: Include budgets for a specific month (YYYY-MM)
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
    const type = url.searchParams.get("type");
    const withBudgets = url.searchParams.get("withBudgets");

    const categories = await db.category.findMany({
      where: {
        userId: session.user.id,
        ...(type && { type }),
      },
      include: withBudgets
        ? {
            budgets: {
              where: { startMonth: withBudgets },
              take: 1,
            },
          }
        : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("[Categories] Error fetching:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch categories" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category.
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
    const { name, type = "spending", color = "#6366f1" } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Name is required" } },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        userId: session.user.id,
        name,
        type,
        color,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    // Check for unique constraint violation
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE", message: "Category with this name already exists" } },
        { status: 409 }
      );
    }
    console.error("[Categories] Error creating:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_FAILED", message: "Failed to create category" } },
      { status: 500 }
    );
  }
}
