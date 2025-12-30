"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, signOut, useSession, getSession } from "@/lib/auth-client";
import { deriveEncryptionKey } from "@somar/shared";

// Key for sessionStorage - persists across page reloads but clears on tab close
//
// SECURITY NOTE: Storing the encryption key in sessionStorage is vulnerable to XSS attacks.
// An attacker with XSS could extract the key. However, this is an accepted trade-off because:
// 1. E2EE primarily protects against server compromise, not client-side attacks
// 2. If an attacker has XSS, they can already intercept the password via keylogging
// 3. They can also wait for decrypted data to appear in the DOM and steal it directly
// 4. Using non-extractable CryptoKey (IndexedDB) adds complexity without meaningful security gain
// 5. Memory-only storage would require re-entering password on every page refresh (poor UX)
//
// The real defense against this threat is preventing XSS in the first place (CSP, sanitization, etc.)
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
  const router = useRouter();
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

      // Fetch user's encryption salt from server
      const saltResponse = await fetch("/api/user/encryption-salt");
      if (!saltResponse.ok) {
        throw new Error("Failed to fetch encryption salt");
      }
      const { salt } = await saltResponse.json();

      // Derive encryption key from password (client-side only)
      const key = await deriveEncryptionKey(password, salt);

      // Set React state - this ensures the key is available immediately for routing
      setEncryptionKey(key);

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

      // Generate salt server-side
      const saltResponse = await fetch("/api/user/encryption-salt", {
        method: "POST",
      });

      if (!saltResponse.ok) {
        throw new Error("Failed to generate encryption salt");
      }

      const { salt } = await saltResponse.json();

      // Derive encryption key from password (client-side only)
      const key = await deriveEncryptionKey(password, salt);

      // Set React state - this ensures the key is available immediately for routing
      setEncryptionKey(key);

      // Navigate to dashboard
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(async () => {
    // Clear key from sessionStorage FIRST
    sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE);
    setEncryptionKey(null);

    // Sign out from Better Auth
    await signOut();

    // Navigate to login page
    router.push("/login");
  }, [router]);

  // Unlock: re-derive encryption key from password
  // Used when opening a new tab (session cookie exists, but sessionStorage is empty)
  const unlock = useCallback(
    async (password: string) => {
      if (!session?.user?.email) {
        throw new Error("No active session");
      }

      // Re-authenticate with Better Auth to verify password is correct
      // This gives immediate feedback for wrong passwords instead of failing later during decryption
      const authResult = await signIn.email({
        email: session.user.email,
        password,
      });

      if (authResult.error) {
        throw new Error("Wrong password");
      }

      // Fetch salt from server
      const saltResponse = await fetch("/api/user/encryption-salt");
      if (!saltResponse.ok) {
        throw new Error("Failed to fetch encryption salt");
      }
      const { salt } = await saltResponse.json();

      // Derive encryption key from password (client-side only)
      const key = await deriveEncryptionKey(password, salt);
      setEncryptionKey(key);
    },
    [session]
  );

  // User needs to unlock if session exists but no encryption key available
  const needsUnlock = !isLoading && !!session && !encryptionKey;

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
