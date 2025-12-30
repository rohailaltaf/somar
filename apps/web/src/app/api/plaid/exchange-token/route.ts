import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { exchangePublicToken } from "@/lib/plaid";

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { publicToken, institutionId, institutionName } = body;

    if (!publicToken || !institutionId || !institutionName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await exchangePublicToken(
      session.user.id,
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





