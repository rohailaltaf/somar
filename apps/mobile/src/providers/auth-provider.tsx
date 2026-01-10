import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { signIn, signUp, signOut, useSession } from "../lib/auth-client";

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
 * Provides authentication state and actions for mobile.
 * All user data is now stored server-side in PostgreSQL.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending: isLoading } = useSession();

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn.email({ email, password });

    if (result.error) {
      throw new Error(result.error.message || "Failed to sign in");
    }

    // Seed categories for new users (idempotent - won't create duplicates)
    // Note: This is now handled server-side on first login
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await signUp.email({ email, password, name });

      if (result.error) {
        throw new Error(result.error.message || "Failed to register");
      }

      // Categories are seeded server-side when user first logs in
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut();
  }, []);

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
