import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, type Href } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { signIn, signUp, signOut, useSession } from "../lib/auth-client";
import { deriveEncryptionKey } from "@somar/shared";
import { fetchEncryptionSalt } from "../lib/api";

// Key for SecureStore - persists across app restarts
const ENCRYPTION_KEY_STORAGE = "somar_encryption_key";

interface AuthContextValue {
  // Session state (from Better Auth)
  session: ReturnType<typeof useSession>["data"];
  isLoading: boolean;

  // Encryption key (derived from password, stored in SecureStore)
  encryptionKey: string | null;

  // True when session exists but encryption key is missing
  needsUnlock: boolean;

  // True during login/register while deriving encryption key
  isDecrypting: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;

  // Unlock with password (derives key without re-authenticating)
  unlock: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and encryption key management for mobile.
 *
 * The encryption key is derived from the user's password on login
 * and stored in SecureStore - persists across app restarts.
 * Never sent to the server.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { data: session, isPending: isLoading } = useSession();

  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isKeyLoading, setIsKeyLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Load encryption key from SecureStore on mount
  useEffect(() => {
    async function loadKey() {
      try {
        const key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE);
        setEncryptionKey(key);
      } catch (error) {
        console.error("Failed to load encryption key:", error);
      } finally {
        setIsKeyLoading(false);
      }
    }
    loadKey();
  }, []);

  // Sync encryption key to SecureStore whenever it changes
  useEffect(() => {
    if (isKeyLoading) return; // Don't sync during initial load

    async function syncKey() {
      try {
        if (encryptionKey) {
          await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE, encryptionKey);
        } else {
          await SecureStore.deleteItemAsync(ENCRYPTION_KEY_STORAGE);
        }
      } catch (error) {
        console.error("Failed to sync encryption key:", error);
      }
    }
    syncKey();
  }, [encryptionKey, isKeyLoading]);

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

      // Show decrypting screen while deriving encryption key
      setIsDecrypting(true);
      try {
        const salt = await fetchEncryptionSalt();
        const key = await deriveEncryptionKey(password, salt);
        setEncryptionKey(key);
        // Navigation is handled by AuthGuard once encryptionKey is set
      } finally {
        setIsDecrypting(false);
      }
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

      // Show decrypting screen while deriving encryption key
      setIsDecrypting(true);
      try {
        const salt = await fetchEncryptionSalt("POST");
        const key = await deriveEncryptionKey(password, salt);
        setEncryptionKey(key);
        // Navigation is handled by AuthGuard once encryptionKey is set
      } finally {
        setIsDecrypting(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    // Clear key from SecureStore
    try {
      await SecureStore.deleteItemAsync(ENCRYPTION_KEY_STORAGE);
    } catch (error) {
      console.error("Failed to delete encryption key:", error);
    }
    setEncryptionKey(null);

    // Sign out from Better Auth
    // AuthGuard will handle navigation to login when session becomes null
    await signOut();
  }, []);

  // Unlock: re-derive encryption key from password
  const unlock = useCallback(
    async (password: string) => {
      if (!session?.user?.email) {
        throw new Error("No active session");
      }

      // Re-authenticate with Better Auth to verify password is correct
      const authResult = await signIn.email({
        email: session.user.email,
        password,
      });

      if (authResult.error) {
        throw new Error("Wrong password");
      }

      const salt = await fetchEncryptionSalt();
      const key = await deriveEncryptionKey(password, salt);
      setEncryptionKey(key);
    },
    [session]
  );

  // User needs to unlock if session exists but no encryption key available
  // (and we're not currently in the process of decrypting during login)
  const needsUnlock =
    !isLoading && !isKeyLoading && !isDecrypting && !!session && !encryptionKey;

  const value: AuthContextValue = {
    session,
    isLoading: isLoading || isKeyLoading,
    encryptionKey,
    needsUnlock,
    isDecrypting,
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
