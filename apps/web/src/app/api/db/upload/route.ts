import { auth } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/db/upload
 *
 * Uploads the user's encrypted database blob.
 * The blob is stored as-is - encryption happens client-side.
 *
 * Supports optimistic locking via version number to prevent conflicts.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Read the encrypted blob from the request body
  const blob = Buffer.from(await req.arrayBuffer());

  // Get expected version from header (for optimistic locking)
  const expectedVersionHeader = req.headers.get("X-Expected-Version");
  const expectedVersion = expectedVersionHeader
    ? parseInt(expectedVersionHeader, 10)
    : null;

  // Check current version if optimistic locking is requested
  if (expectedVersion !== null) {
    const current = await db.encryptedDatabase.findUnique({
      where: { userId },
      select: { version: true },
    });

    if (current && current.version !== expectedVersion) {
      return NextResponse.json(
        {
          error: "conflict",
          message: "Database was updated elsewhere. Please refresh.",
          serverVersion: current.version,
        },
        { status: 409 }
      );
    }
  }

  // Store the encrypted blob
  const storage = getStorage();
  await storage.put(`users/${userId}.db.enc`, blob);

  // Update metadata in central DB
  const updated = await db.encryptedDatabase.upsert({
    where: { userId },
    update: {
      version: { increment: 1 },
      sizeBytes: blob.length,
      updatedAt: new Date(),
    },
    create: {
      userId,
      version: 1,
      sizeBytes: blob.length,
    },
  });

  return NextResponse.json({
    ok: true,
    version: updated.version,
  });
}
