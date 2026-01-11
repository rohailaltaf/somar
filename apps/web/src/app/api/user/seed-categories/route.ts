import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Default categories to seed for new users.
 */
const DEFAULT_CATEGORIES = [
  { name: "personal", type: "spending", color: "oklch(0.65 0.15 280)" },
  { name: "restaurant", type: "spending", color: "oklch(0.65 0.2 30)" },
  { name: "grocery", type: "spending", color: "oklch(0.65 0.18 140)" },
  { name: "shopping", type: "spending", color: "oklch(0.65 0.18 350)" },
  { name: "entertainment", type: "spending", color: "oklch(0.65 0.2 330)" },
  { name: "subscriptions", type: "spending", color: "oklch(0.6 0.15 300)" },
  { name: "travel", type: "spending", color: "oklch(0.6 0.18 200)" },
  { name: "car", type: "spending", color: "oklch(0.5 0.12 240)" },
  { name: "house", type: "spending", color: "oklch(0.6 0.12 80)" },
  { name: "work", type: "spending", color: "oklch(0.55 0.15 250)" },
  { name: "job income", type: "income", color: "oklch(0.7 0.2 140)" },
  { name: "transfers", type: "transfer", color: "oklch(0.5 0.08 220)" },
  { name: "credit card payments", type: "transfer", color: "oklch(0.5 0.08 200)" },
  { name: "reimbursed", type: "transfer", color: "oklch(0.7 0.15 150)" },
];

/**
 * POST /api/user/seed-categories
 * Seed default categories for a new user.
 * Only creates categories that don't already exist.
 */
export async function POST() {
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
    // Check if user already has categories
    const existingCount = await db.category.count({
      where: { userId: session.user.id },
    });

    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        data: { created: 0, message: "User already has categories" },
      });
    }

    // Create default categories
    const created = await db.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        userId: session.user.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
      })),
    });

    return NextResponse.json({
      success: true,
      data: { created: created.count },
    });
  } catch (error) {
    console.error("[Seed Categories] Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SEED_FAILED", message: "Failed to seed categories" } },
      { status: 500 }
    );
  }
}
