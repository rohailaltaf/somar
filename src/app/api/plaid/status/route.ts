import { NextResponse } from "next/server";
import { checkAllPlaidItemsStatus } from "@/actions/plaid";

// GET /api/plaid/status - Check the status of all Plaid items
// Useful for verifying disconnections and debugging billing
export async function GET() {
  try {
    const result = await checkAllPlaidItemsStatus();
    
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



