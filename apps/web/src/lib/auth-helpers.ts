/**
 * Auth helpers for demo mode.
 * Provides getEffectiveUserId() that returns the demo user ID if in demo mode.
 */

import { auth, type Session } from "./auth";
import { db } from "./db";
import { isDemoMode } from "./demo-mode";
import { headers } from "next/headers";

interface AuthResult {
  session: Session | null;
  effectiveUserId: string | null;
  isDemo: boolean;
}

/**
 * Get the authenticated session and effective user ID.
 * If the user is in demo mode and has a linked demo user, returns the demo user's ID.
 * Otherwise returns the real user's ID.
 */
export async function getAuthContext(): Promise<AuthResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { session: null, effectiveUserId: null, isDemo: false };
  }

  const isDemo = await isDemoMode();

  if (isDemo) {
    // Look up the user's linked demo user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { demoUserId: true },
    });

    if (user?.demoUserId) {
      return {
        session,
        effectiveUserId: user.demoUserId,
        isDemo: true,
      };
    }
  }

  return {
    session,
    effectiveUserId: session.user.id,
    isDemo: false,
  };
}

/**
 * Get the effective user ID for API routes.
 * Returns the demo user ID if in demo mode, otherwise the real user ID.
 * Returns null if not authenticated.
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const { effectiveUserId } = await getAuthContext();
  return effectiveUserId;
}
