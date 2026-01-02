import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * GET /api/user/encryption-salt
 *
 * Returns the user's encryption salt for key derivation.
 * The salt is not secret but provides uniqueness for PBKDF2.
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { encryptionSalt: true },
  });

  if (!user?.encryptionSalt) {
    return NextResponse.json({ error: "No encryption salt found" }, { status: 404 });
  }

  return NextResponse.json({ salt: user.encryptionSalt });
}

/**
 * POST /api/user/encryption-salt
 *
 * Generates and stores the user's encryption salt (only if not already set).
 * Salt is generated server-side to ensure cryptographic randomness.
 * Called during registration.
 */
export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only set salt if not already set (prevent changing salt which would break decryption)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { encryptionSalt: true },
  });

  if (user?.encryptionSalt) {
    return NextResponse.json(
      { error: "Encryption salt already set. Use GET to retrieve it." },
      { status: 409 }
    );
  }

  // Generate salt server-side using Node's CSPRNG
  const salt = randomBytes(32).toString("hex");

  await db.user.update({
    where: { id: session.user.id },
    data: { encryptionSalt: salt },
  });

  return NextResponse.json({ salt });
}
