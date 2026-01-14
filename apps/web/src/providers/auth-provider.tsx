"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession, emailOtp } from "@/lib/auth-client";
import { initialOtpState, type OtpState } from "@somar/shared/components";

const OTP_STATE_KEY = "somar_otp_state";

interface AuthContextValue {
  // Session state (from Better Auth)
  session: ReturnType<typeof useSession>["data"];
  isLoading: boolean;

  // OTP step state (persists across component remounts)
  otpState: OtpState;
  setOtpState: (state: OtpState) => void;
  resetOtpState: () => void;

  // OTP auth actions
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;

  // Social auth
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;

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
  const [otpState, setOtpStateInternal] = useState<OtpState>(initialOtpState);
  const [isOtpStateLoaded, setIsOtpStateLoaded] = useState(false);

  // Restore OTP state from sessionStorage on mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const stored = sessionStorage.getItem(OTP_STATE_KEY);
    if (stored) {
      try {
        setOtpStateInternal(JSON.parse(stored) as OtpState);
      } catch {
        // Invalid JSON, use initial state
      }
    }
    setIsOtpStateLoaded(true);
  }, []);

  const setOtpState = useCallback((state: OtpState) => {
    setOtpStateInternal(state);
    sessionStorage.setItem(OTP_STATE_KEY, JSON.stringify(state));
  }, []);

  const resetOtpState = useCallback(() => {
    setOtpStateInternal(initialOtpState);
    sessionStorage.removeItem(OTP_STATE_KEY);
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    const result = await emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to send code");
    }
  }, []);

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      const result = await signIn.emailOtp({ email, otp });

      if (result.error) {
        throw new Error(result.error.message || "Invalid code");
      }

      // Set verifying state to keep showing loading spinner until navigation completes
      setOtpStateInternal((prev) => ({ ...prev, step: "verifying" }));
      sessionStorage.removeItem(OTP_STATE_KEY);
      router.push("/");
    },
    [router]
  );

  const loginWithGoogle = useCallback(async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  }, []);

  const loginWithGoogleIdToken = useCallback(
    async (idToken: string) => {
      const result = await signIn.social({
        provider: "google",
        idToken: {
          token: idToken,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to sign in with Google");
      }

      router.push("/");
    },
    [router]
  );

  const logout = useCallback(async () => {
    await signOut();
    setOtpStateInternal(initialOtpState);
    sessionStorage.removeItem(OTP_STATE_KEY);
    router.push("/login");
  }, [router]);

  const value: AuthContextValue = {
    session,
    isLoading: isLoading || !isOtpStateLoaded,
    otpState,
    setOtpState,
    resetOtpState,
    sendOtp,
    verifyOtp,
    loginWithGoogle,
    loginWithGoogleIdToken,
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
