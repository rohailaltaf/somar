import { authClient } from "./auth-client";

function getApiUrl(): string {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL environment variable is required");
  }
  return process.env.EXPO_PUBLIC_API_URL;
}

export const API_URL = getApiUrl();

/**
 * Fetch wrapper that automatically includes auth cookies.
 * Use this for all authenticated API calls in mobile.
 */
export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookies = await authClient.getCookie();

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: cookies,
    },
    credentials: "omit",
  });
}

/**
 * Fetches or generates the user's encryption salt from the server.
 * @param method - "GET" to fetch existing salt, "POST" to generate new salt
 */
export async function fetchEncryptionSalt(
  method: "GET" | "POST" = "GET"
): Promise<string> {
  const response = await fetchWithAuth("/api/user/encryption-salt", { method });

  if (!response.ok) {
    throw new Error(
      method === "POST"
        ? "Failed to generate encryption salt"
        : "Failed to fetch encryption salt"
    );
  }

  const { salt } = await response.json();
  return salt;
}
