"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { DatabaseProvider, useDatabase } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Loading screen shown while the encrypted database is being downloaded and decrypted.
 */
function DecryptingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <Loader2 className="absolute -top-1 -right-1 w-6 h-6 animate-spin text-indigo-400" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-white">
          Decrypting your data
        </h2>
        <p className="mt-2 text-slate-400 max-w-xs">
          Your financial data is end-to-end encrypted. Loading securely...
        </p>
      </div>
    </div>
  );
}

/**
 * Error screen shown when database fails to load.
 */
function DatabaseErrorScreen({ error }: { error: Error }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <CardTitle className="text-xl text-red-400">
            Error Loading Data
          </CardTitle>
          <CardDescription className="text-slate-400">
            {error.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={() => (window.location.href = "/login")}
          >
            Try Signing In Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Gate that blocks rendering until the database is fully loaded.
 * Shows a decrypting screen while loading, error screen on failure.
 */
function DatabaseReadyGate({ children }: { children: ReactNode }) {
  const { isLoading, error, isReady } = useDatabase();

  if (isLoading) {
    return <DecryptingScreen />;
  }

  if (error) {
    return <DatabaseErrorScreen error={error} />;
  }

  // Only render children when database is fully ready
  if (!isReady) {
    return <DecryptingScreen />;
  }

  return <>{children}</>;
}

/**
 * Unlock prompt shown when user has a session but no encryption key
 * (e.g., opened a new tab where sessionStorage is empty)
 */
function UnlockPrompt() {
  const { session, unlock, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setIsUnlocking(true);

    try {
      await unlock(password);
      // Success - database will now initialize
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unlock"
      );
      setIsUnlocking(false);
    }
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch (error) {
      // logout() does hard navigation, so this rarely fires
      console.error("Sign out error:", error);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Unlock Your Data
          </CardTitle>
          <CardDescription className="text-slate-400">
            Welcome back, {session?.user?.name || session?.user?.email}! 
            Enter your password to decrypt your data in this tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-400"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isUnlocking}
            >
              {isUnlocking ? "Unlocking..." : "Unlock"}
            </Button>
          </form>
          <div className="text-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-slate-400 hover:text-slate-300 hover:underline"
            >
              Sign out instead
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Your data is encrypted with your password. We need it to decrypt your data in this browser tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading screen shown while auth is being checked.
 * Prevents flash of content before we know auth state.
 */
function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Wraps children with DatabaseProvider only when user is authenticated
 * and encryption key is available.
 */
function DatabaseGate({ children }: { children: ReactNode }) {
  const { needsUnlock, isLoading: authLoading, encryptionKey: contextKey, session } = useAuth();

  // Use encryption key from context state, with sessionStorage as fallback
  // Context state is updated immediately after unlock()
  // sessionStorage is used on page load (before context state is set)
  const encryptionKey = contextKey || (typeof window !== "undefined" 
    ? sessionStorage.getItem("somar_encryption_key") 
    : null);

  // While auth is loading, show a minimal loading screen to prevent flash of content
  // This prevents: dashboard → decrypt → dashboard flicker
  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  // Show unlock prompt if session exists but no encryption key
  if (needsUnlock) {
    return <UnlockPrompt />;
  }

  // Only use encryption key if we have a valid session
  // This prevents showing decrypt screen when logged out but sessionStorage has stale key
  if (session && encryptionKey) {
    return (
      <DatabaseProvider encryptionKey={encryptionKey}>
        <DatabaseReadyGate>{children}</DatabaseReadyGate>
      </DatabaseProvider>
    );
  }

  // No session or no encryption key - pass through children
  // Middleware will redirect to /login if unauthenticated
  return <>{children}</>;
}

/**
 * Root providers for the application.
 *
 * Provides:
 * - React Query for data fetching
 * - Authentication context
 * - Database context (when authenticated)
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
        <DatabaseGate>{children}</DatabaseGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
