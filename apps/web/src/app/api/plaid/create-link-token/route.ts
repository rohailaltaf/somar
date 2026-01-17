import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { createLinkToken } from "@/lib/plaid";
import { generateDemoLinkToken, DEMO_INSTITUTIONS } from "@/lib/demo-plaid";

export async function POST() {
  const { session, effectiveUserId, isDemo } = await getAuthContext();

  if (!effectiveUserId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // In demo mode, return a demo link token and institutions
  if (isDemo) {
    return NextResponse.json({
      linkToken: generateDemoLinkToken(),
      isDemo: true,
      demoInstitutions: DEMO_INSTITUTIONS,
    });
  }

  const result = await createLinkToken(session!.user.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ linkToken: result.linkToken });
}


