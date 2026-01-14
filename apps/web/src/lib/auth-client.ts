import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

function getBaseUrl(): string {
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is required");
  }
  return process.env.NEXT_PUBLIC_APP_URL;
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [emailOTPClient()],
});

export const {
  signIn,
  signOut,
  useSession,
  getSession,
  emailOtp,
} = authClient;

