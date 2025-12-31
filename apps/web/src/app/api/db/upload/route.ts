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
 * Uses upsert to handle both first upload (create) and subsequent uploads (update).
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
    ? BigInt(expectedVersionHeader)
    : null;

  const storage = getStorage();

  try {
    const result = await db.$transaction(async (tx) => {
      // Check current version for optimistic locking
      const current = await tx.encryptedDatabase.findUnique({
        where: { userId },
        select: { version: true },
      });

      // Validate version if optimistic locking is requested
      if (expectedVersion !== null && current && current.version !== expectedVersion) {
        throw { type: "conflict", serverVersion: current.version };
      }

      // Upsert metadata - create on first upload, update on subsequent
      const newVersion = current ? current.version + 1n : 1n;

      await tx.encryptedDatabase.upsert({
        where: { userId },
        create: {
          userId,
          version: 1,
          sizeBytes: blob.length,
        },
        update: {
          version: newVersion,
          sizeBytes: blob.length,
          updatedAt: new Date(),
        },
      });

      return { version: newVersion };
    });

    // Write storage only after transaction commits successfully
    // This ensures only the winner of the version race writes to storage
    await storage.put(`users/${userId}.db.enc`, blob);

    return NextResponse.json({
      ok: true,
      version: result.version.toString(),
    });
  } catch (err) {
    if (err && typeof err === "object" && "type" in err && err.type === "conflict") {
      const conflictErr = err as unknown as { serverVersion: bigint };
      return NextResponse.json(
        {
          error: "conflict",
          message: "Database was updated elsewhere. Please refresh.",
          serverVersion: conflictErr.serverVersion.toString(),
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
