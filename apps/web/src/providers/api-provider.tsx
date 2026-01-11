"use client";

import { useEffect, type ReactNode } from "react";
import { configureApiClient } from "@somar/shared/api-client";

interface ApiProviderProps {
  children: ReactNode;
}

/**
 * Configures the API client for web.
 * On web, we use same-origin requests and cookies are sent automatically.
 */
export function ApiProvider({ children }: ApiProviderProps) {
  useEffect(() => {
    configureApiClient({
      baseUrl: "", // Same origin - no base URL needed
      getAuthHeaders: () => ({}), // Cookies are sent automatically on same-origin requests
    });
  }, []);

  return <>{children}</>;
}
