"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { signIn, signUp, signOut, useSession, getSession } from "@/lib/auth-client";
import { deriveEncryptionKey } from "@somar/shared";

// Key for sessionStorage - persists across page reloads but clears on tab close
const ENCRYPTION_KEY_STORAGE = "somar_encryption_key";

interface AuthContextValue {
  // Session state (from Better Auth)
  session: ReturnType<typeof useSession>["data"];
  isLoading: boolean;

  // Encryption key (derived from password, stored in sessionStorage)
  encryptionKey: string | null;

  // True when session exists but encryption key is missing (new tab scenario)
  needsUnlock: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Unlock with password (for new tab scenario - derives key without re-authenticating)
  unlock: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and encryption key management.
 *
 * The encryption key is derived from the user's password on login
 * and stored in sessionStorage - persists across page reloads but
 * clears when the browser tab is closed. Never sent to the server.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending: isLoading } = useSession();
  
  // Initialize from sessionStorage if available
  const [encryptionKey, setEncryptionKey] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(ENCRYPTION_KEY_STORAGE);
  });

  // Sync encryption key to sessionStorage whenever it changes
  useEffect(() => {
    if (encryptionKey) {
      sessionStorage.setItem(ENCRYPTION_KEY_STORAGE, encryptionKey);
    } else {
      sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE);
    }
  }, [encryptionKey]);

  // Clear encryption key if session expires/invalidates
  useEffect(() => {
    if (!isLoading && !session && encryptionKey) {
      setEncryptionKey(null);
    }
  }, [session, isLoading, encryptionKey]);

  const login = useCallback(
    async (email: string, password: string) => {
      // Sign in with Better Auth
      const result = await signIn.email({ email, password });

      if (result.error) {
        throw new Error(result.error.message || "Failed to sign in");
      }

      // Derive encryption key from password (client-side only)
      const key = await deriveEncryptionKey(password, email);
      
      // Set encryption key in sessionStorage BEFORE navigation
      sessionStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
      
      // Hard navigation - ensures fresh page load with sessionStorage already set
      // This avoids race conditions with React state updates
      window.location.href = "/";
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      // Register with Better Auth (auto-signs in)
      const result = await signUp.email({ email, password, name });

      if (result.error) {
        throw new Error(result.error.message || "Failed to register");
      }

      // Derive encryption key from password (client-side only)
      const key = await deriveEncryptionKey(password, email);
      
      // Set encryption key in sessionStorage BEFORE navigation
      sessionStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
      
      // Hard navigation - ensures fresh page load with sessionStorage already set
      window.location.href = "/";
    },
    []
  );

  const logout = useCallback(async () => {
    // Clear encryption key from sessionStorage FIRST
    sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE);
    setEncryptionKey(null);

    // Sign out from Better Auth
    await signOut();

    // Hard navigation to login page
    window.location.href = "/login";
  }, []);

  // Unlock: re-derive encryption key from password without re-authenticating
  // Used when opening a new tab (session cookie exists, but sessionStorage is empty)
  const unlock = useCallback(
    async (password: string) => {
      if (!session?.user?.email) {
        throw new Error("No active session");
      }

      // Verify session is still valid on the server before accepting password
      // This prevents the unlock screen from accepting passwords for expired sessions
      const freshSession = await getSession();
      if (!freshSession?.data?.user) {
        // Session expired - clear local state and redirect to login
        sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE);
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }

      // Derive encryption key from password (client-side only)
      const key = await deriveEncryptionKey(password, session.user.email);
      setEncryptionKey(key);
    },
    [session]
  );

  // User needs to unlock if:
  // - Auth is not loading
  // - Session exists
  // - No encryption key in state or sessionStorage
  const storedKey = typeof window !== "undefined" 
    ? sessionStorage.getItem(ENCRYPTION_KEY_STORAGE) 
    : null;
  const needsUnlock = !isLoading && !!session && !encryptionKey && !storedKey;

  const value: AuthContextValue = {
    session,
    isLoading,
    encryptionKey,
    needsUnlock,
    login,
    register,
    logout,
    unlock,
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
