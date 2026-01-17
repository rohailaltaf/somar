/**
 * Demo mode helpers.
 * Manages the demo mode state via cookies.
 */

import { cookies } from "next/headers";

const DEMO_MODE_COOKIE = "demo_mode";

/**
 * Check if the user is currently in demo mode (server-side).
 */
export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_MODE_COOKIE)?.value === "true";
}

/**
 * Enter demo mode by setting the cookie (server-side).
 */
export async function enterDemoMode(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_MODE_COOKIE, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Demo mode lasts for 24 hours
    maxAge: 60 * 60 * 24,
  });
}

/**
 * Exit demo mode by clearing the cookie (server-side).
 */
export async function exitDemoMode(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_MODE_COOKIE);
}
