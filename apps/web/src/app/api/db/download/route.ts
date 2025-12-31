import { auth } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/db/download
 *
 * Downloads the user's encrypted database blob.
 * The blob is returned as-is - decryption happens client-side.
 * Returns the current version in X-Database-Version header for optimistic locking.
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const storage = getStorage();
  const blob = await storage.get(`users/${userId}.db.enc`);

  if (!blob) {
    // New user - no database yet
    return NextResponse.json({ error: "No database found" }, { status: 404 });
  }

  // Get current version for optimistic locking
  const metadata = await db.encryptedDatabase.findUnique({
    where: { userId },
    select: { version: true },
  });

  // Convert Buffer to Uint8Array for Response constructor
  const uint8Array = new Uint8Array(blob);
  
  return new Response(uint8Array, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": blob.length.toString(),
      "X-Database-Version": (metadata?.version ?? 1n).toString(),
    },
  });
}
