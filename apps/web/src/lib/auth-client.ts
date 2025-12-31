import { createAuthClient } from "better-auth/react";

function getBaseUrl(): string {
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is required");
  }
  return process.env.NEXT_PUBLIC_APP_URL;
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

