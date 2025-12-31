import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createInitialDatabase } from "@/lib/sqlite-server";

/**
 * POST /api/db/init
 *
 * Creates and returns an initial SQLite database with schema and default categories.
 * This is called during registration to provide the user with a template database.
 *
 * The database is returned UNENCRYPTED because:
 * 1. It contains no personal data (just schema + default categories)
 * 2. The client will encrypt it with the user's key before uploading
 *
 * Idempotency:
 * - If user already has an encrypted database, returns 409 Conflict
 * - This prevents overwriting existing user data
 */
export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if user already has a database (idempotency / race condition protection)
  const storage = getStorage();
  const existingDb = await storage.exists(`users/${userId}.db.enc`);

  if (existingDb) {
    return NextResponse.json(
      { error: "Database already exists. Use /api/db/download instead." },
      { status: 409 }
    );
  }

  // Also check metadata table for extra safety
  const existingMeta = await db.encryptedDatabase.findUnique({
    where: { userId },
  });

  if (existingMeta) {
    return NextResponse.json(
      { error: "Database already exists. Use /api/db/download instead." },
      { status: 409 }
    );
  }

  // Create fresh database with schema and defaults
  const dbBuffer = createInitialDatabase();

  // Convert Buffer to Uint8Array for Response constructor
  const uint8Array = new Uint8Array(dbBuffer);

  // Return raw bytes - client will encrypt
  return new Response(uint8Array, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": dbBuffer.length.toString(),
    },
  });
}
