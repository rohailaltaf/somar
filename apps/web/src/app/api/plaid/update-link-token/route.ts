import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createUpdateModeLinkToken } from "@/lib/plaid";

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
    const { plaidItemId } = body;

    if (!plaidItemId) {
      return NextResponse.json(
        { error: "Missing plaidItemId" },
        { status: 400 }
      );
    }

    const result = await createUpdateModeLinkToken(session.user.id, plaidItemId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ linkToken: result.linkToken });
  } catch (error) {
    console.error("Error in update-link-token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




