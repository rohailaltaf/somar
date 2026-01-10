"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider, useAuth, ApiProvider } from "@/providers";
import { Loader2 } from "lucide-react";

/**
 * Loading screen shown while auth is being checked.
 * Prevents flash of content before we know auth state.
 */
function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface-deep p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
}

/**
 * Gate that shows loading while auth is being checked.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading: authLoading } = useAuth();

  // While auth is loading, show a minimal loading screen to prevent flash of content
  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

/**
 * Root providers for the application.
 *
 * Provides:
 * - React Query for data fetching
 * - Authentication context
 * - API client configuration
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiProvider>
          <AuthGate>{children}</AuthGate>
        </ApiProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
