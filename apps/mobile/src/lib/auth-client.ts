import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

function getApiUrl(): string {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL environment variable is required");
  }
  return process.env.EXPO_PUBLIC_API_URL;
}

export const API_URL = getApiUrl();

// Create the auth client with secure storage
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "somar",
      storagePrefix: "somar",
      storage: SecureStore,
    }),
    emailOTPClient(),
  ],
});

export const { signIn, signOut, useSession, getSession, emailOtp } = authClient;
