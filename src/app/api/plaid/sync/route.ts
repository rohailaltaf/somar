import { NextRequest, NextResponse } from "next/server";
import { syncTransactionsForItem, syncAllTransactions } from "@/actions/plaid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { plaidItemId } = body;

    if (plaidItemId) {
      // Sync specific item
      const result = await syncTransactionsForItem(plaidItemId);
      return NextResponse.json(result);
    } else {
      // Sync all items
      const results = await syncAllTransactions();
      return NextResponse.json({ results });
    }
  } catch (error) {
    console.error("Error in sync:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}





