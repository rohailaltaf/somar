import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createLinkToken } from "@/lib/plaid";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const result = await createLinkToken(session.user.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ linkToken: result.linkToken });
}


