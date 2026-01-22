import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { exitDemoMode } from "@/lib/demo-mode";

/**
 * POST /api/demo/exit
 * Exit demo mode by clearing the demo mode cookie.
 */
export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  try {
    await exitDemoMode();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Demo] Error exiting demo mode:", error);
    return NextResponse.json(
      { success: false, error: { code: "EXIT_FAILED", message: "Failed to exit demo mode" } },
      { status: 500 }
    );
  }
}
