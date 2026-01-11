import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/finance-accounts/[id]
 * Update a finance account.
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
    const existing = await db.financeAccount.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Account not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, type } = body;

    const account = await db.financeAccount.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
      },
    });

    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    console.error("[Finance Accounts] Error updating:", error);
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_FAILED", message: "Failed to update account" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finance-accounts/[id]
 * Delete a finance account (cascades to transactions).
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
    const existing = await db.financeAccount.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Account not found" } },
        { status: 404 }
      );
    }

    await db.financeAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Finance Accounts] Error deleting:", error);
    return NextResponse.json(
      { success: false, error: { code: "DELETE_FAILED", message: "Failed to delete account" } },
      { status: 500 }
    );
  }
}
