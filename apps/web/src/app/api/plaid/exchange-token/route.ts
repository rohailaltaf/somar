import { NextRequest, NextResponse } from "next/server";
import { exchangePublicToken } from "@/actions/plaid";

export async function POST(request: NextRequest) {
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
      accountCount: result.accountCount,
    });
  } catch (error) {
    console.error("Error in exchange-token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}





