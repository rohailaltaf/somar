import { NextResponse } from "next/server";
import { createLinkToken } from "@/lib/plaid";

export async function POST() {
  const result = await createLinkToken();

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ linkToken: result.linkToken });
}


