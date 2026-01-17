import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { exchangePublicToken } from "@/lib/plaid";
import { isDemoPublicToken, createDemoPlaidItem } from "@/lib/demo-plaid";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { session, effectiveUserId, isDemo } = await getAuthContext();

  if (!effectiveUserId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { publicToken, institutionId, institutionName } = body;

    if (!publicToken || !institutionId || !institutionName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle demo mode
    if (isDemo && isDemoPublicToken(publicToken)) {
      const result = await createDemoPlaidItem(effectiveUserId, institutionId, institutionName);

      // Get the created accounts
      const accounts = await db.financeAccount.findMany({
        where: { id: { in: result.accountIds } },
      });

      return NextResponse.json({
        success: true,
        itemId: result.plaidItemId,
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
        })),
      });
    }

    const result = await exchangePublicToken(
      session!.user.id,
      publicToken,
      institutionId,
      institutionName
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      itemId: result.itemId,
      accounts: result.accounts,
    });
  } catch (error) {
    console.error("Error in exchange-token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}





