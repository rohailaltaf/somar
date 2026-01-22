import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { enterDemoMode } from "@/lib/demo-mode";
import { generateDemoData } from "@/lib/demo-data/generator";
import { v4 as uuid } from "uuid";

// Default categories for new users (same as in auth.ts)
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
 * POST /api/demo/enter
 * Enter demo mode. Creates a demo user with sample data if not exists.
 * Only available to PENDING users.
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
    // Get user with demo info
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { status: true, demoUserId: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Only allow PENDING users to enter demo mode
    if (user.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_ALLOWED", message: "Demo mode is only available for pending users" } },
        { status: 403 }
      );
    }

    // If no demo user exists, create one with demo data
    if (!user.demoUserId) {
      const demoUserId = uuid();

      // Create demo user
      await db.user.create({
        data: {
          id: demoUserId,
          name: "Demo User",
          email: `demo-${demoUserId}@demo.local`,
          emailVerified: true,
          status: "APPROVED", // Demo user is "approved" so data works normally
          isDemoAccount: true,
        },
      });

      // Create default categories for demo user
      await db.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          userId: demoUserId,
          name: cat.name,
          type: cat.type,
          color: cat.color,
        })),
      });

      // Generate demo data
      await generateDemoData(demoUserId);

      // Link demo user to real user
      await db.user.update({
        where: { id: session.user.id },
        data: { demoUserId },
      });
    }

    // Set demo mode cookie
    await enterDemoMode();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Demo] Error entering demo mode:", error);
    return NextResponse.json(
      { success: false, error: { code: "ENTER_FAILED", message: "Failed to enter demo mode" } },
      { status: 500 }
    );
  }
}
