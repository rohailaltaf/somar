import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkAllPlaidItemsStatus } from "@/lib/plaid";

// GET /api/plaid/status - Check the status of all Plaid items
// Useful for verifying disconnections and debugging billing
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const result = await checkAllPlaidItemsStatus(session.user.id);

    return NextResponse.json({
      ...result,
      summary: {
        total: result.items.length,
        active: result.items.filter(i => i.status === "active").length,
        removed: result.items.filter(i => i.status === "removed").length,
        errors: result.items.filter(i => i.status === "error").length,
      },
      billingNote: "You are billed for 'active' items only. 'removed' and 'error' items should not be billed.",
    });
  } catch (error) {
    console.error("Error checking Plaid items status:", error);
    return NextResponse.json(
      { error: "Failed to check Plaid items status" },
      { status: 500 }
    );
  }
}




