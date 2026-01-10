"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, signOut, useSession } from "@/lib/auth-client";

interface AuthContextValue {
  // Session state (from Better Auth)
  session: ReturnType<typeof useSession>["data"];
  isLoading: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and actions.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { data: session, isPending: isLoading } = useSession();

  const login = useCallback(
    async (email: string, password: string) => {
      // Sign in with Better Auth
      const result = await signIn.email({ email, password });

      if (result.error) {
        throw new Error(result.error.message || "Failed to sign in");
      }

      // Seed categories for new users (idempotent - won't create duplicates)
      await fetch("/api/user/seed-categories", { method: "POST" });

      // Navigate to dashboard
      router.push("/");
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      // Register with Better Auth (auto-signs in)
      const result = await signUp.email({ email, password, name });

      if (result.error) {
        throw new Error(result.error.message || "Failed to register");
      }

      // Seed default categories for new user
      await fetch("/api/user/seed-categories", { method: "POST" });

      // Navigate to dashboard
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(async () => {
    // Sign out from Better Auth
    await signOut();

    // Navigate to login page
    router.push("/login");
  }, [router]);

  const value: AuthContextValue = {
    session,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication state and actions.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
