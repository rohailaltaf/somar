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
    ? BigInt(expectedVersionHeader)
    : null;

  const storage = getStorage();

  // Use atomic transaction to prevent race conditions
  // The version check and update happen atomically
  try {
    const result = await db.$transaction(async (tx) => {
      const current = await tx.encryptedDatabase.findUnique({
        where: { userId },
        select: { version: true },
      });

      // Check version if optimistic locking is requested
      if (expectedVersion !== null && current && current.version !== expectedVersion) {
        throw { type: "conflict", serverVersion: current.version };
      }

      // Store the encrypted blob
      await storage.put(`users/${userId}.db.enc`, blob);

      // Update metadata atomically
      if (current) {
        // Use updateMany with version in WHERE to ensure atomicity
        const updateResult = await tx.encryptedDatabase.updateMany({
          where: {
            userId,
            version: current.version, // Only update if version hasn't changed
          },
          data: {
            version: current.version + 1n,
            sizeBytes: blob.length,
            updatedAt: new Date(),
          },
        });

        // If no rows updated, another request beat us to it
        if (updateResult.count === 0) {
          throw { type: "conflict", serverVersion: current.version + 1n };
        }

        return { version: current.version + 1n };
      } else {
        // New record - create it
        const created = await tx.encryptedDatabase.create({
          data: {
            userId,
            version: 1,
            sizeBytes: blob.length,
          },
        });
        return { version: created.version };
      }
    });

    return NextResponse.json({
      ok: true,
      version: result.version.toString(),
    });
  } catch (err) {
    if (err && typeof err === "object" && "type" in err && err.type === "conflict") {
      return NextResponse.json(
        {
          error: "conflict",
          message: "Database was updated elsewhere. Please refresh.",
          serverVersion: (err as unknown as { serverVersion: bigint }).serverVersion.toString(),
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
