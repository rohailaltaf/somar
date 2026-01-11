import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { signIn, signOut, useSession, emailOtp, updateUser } from "../lib/auth-client";

interface AuthContextValue {
  // Session state (from Better Auth)
  session: ReturnType<typeof useSession>["data"];
  isLoading: boolean;

  // OTP auth actions
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string, name?: string) => Promise<void>;

  // Social auth
  loginWithGoogle: () => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and actions for mobile.
 * All user data is stored server-side in PostgreSQL.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending: isLoading } = useSession();

  const sendOtp = useCallback(async (email: string) => {
    const result = await emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to send code");
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string, name?: string) => {
    const result = await signIn.emailOtp({ email, otp });

    if (result.error) {
      throw new Error(result.error.message || "Invalid code");
    }

    // If name was provided (registration flow), update the user profile
    if (name) {
      try {
        await updateUser({ name });
      } catch (err) {
        console.error("Failed to update user name:", err);
        // Don't throw - user is already signed in, name can be updated later
      }
    }

    // Categories are seeded server-side when user is created
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await signIn.social({
      provider: "google",
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const value: AuthContextValue = {
    session,
    isLoading,
    sendOtp,
    verifyOtp,
    loginWithGoogle,
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
