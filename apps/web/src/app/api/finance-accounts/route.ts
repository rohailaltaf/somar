import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * GET /api/finance-accounts
 * List all finance accounts for the current user.
 */
export async function GET() {
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
    const accounts = await db.financeAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    console.error("[Finance Accounts] Error fetching:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch accounts" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance-accounts
 * Create a new finance account.
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
    const { name, type, plaidAccountId } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Name and type are required" } },
        { status: 400 }
      );
    }

    const account = await db.financeAccount.create({
      data: {
        userId: session.user.id,
        name,
        type,
        plaidAccountId,
      },
    });

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error) {
    console.error("[Finance Accounts] Error creating:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_FAILED", message: "Failed to create account" } },
      { status: 500 }
    );
  }
}
