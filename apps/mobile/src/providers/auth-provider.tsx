import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { signIn, signOut, useSession, emailOtp } from "../lib/auth-client";

interface AuthContextValue {
  // Session state (from Better Auth)
  session: ReturnType<typeof useSession>["data"];
  isLoading: boolean;

  // OTP auth actions
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;

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

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const result = await emailOtp.verifyOtp({ email, otp });

    if (result.error) {
      throw new Error(result.error.message || "Invalid code");
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
