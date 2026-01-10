import { useEffect, type ReactNode } from "react";
import { configureApiClient } from "@somar/shared/api-client";
import { authClient, API_URL } from "../lib/auth-client";

interface ApiProviderProps {
  children: ReactNode;
}

/**
 * Configures the API client for mobile.
 * On mobile, we send cookies from the Better Auth expo client.
 */
export function ApiProvider({ children }: ApiProviderProps) {
  useEffect(() => {
    configureApiClient({
      baseUrl: API_URL,
      getAuthHeaders: async (): Promise<Record<string, string>> => {
        // Get cookies from Better Auth expo client
        const cookies = await authClient.getCookie();
        if (cookies) {
          return { Cookie: cookies };
        }
        return {};
      },
    });
  }, []);

  return <>{children}</>;
}
