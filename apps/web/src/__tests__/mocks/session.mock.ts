/**
 * Session mock for testing authenticated API routes.
 */

import { TEST_USER_ID } from "../helpers/test-db";

export interface MockSessionData {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
  };
}

/**
 * Creates a mock session for a test user.
 */
export function createMockSession(
  userId: string = TEST_USER_ID,
  email: string = "test@example.com"
): MockSessionData {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    user: {
      id: userId,
      email,
      name: "Test User",
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
    session: {
      id: `session-${userId}`,
      expiresAt,
      token: `token-${userId}`,
      createdAt: now,
      updatedAt: now,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      userId,
    },
  };
}

/**
 * Mock session state for controlling test scenarios.
 */
export const mockSessionState = {
  session: null as MockSessionData | null,

  setSession(session: MockSessionData | null): void {
    this.session = session;
  },

  setTestUser(userId: string = TEST_USER_ID): void {
    this.session = createMockSession(userId);
  },

  clearSession(): void {
    this.session = null;
  },

  getSession(): MockSessionData | null {
    return this.session;
  },
};
