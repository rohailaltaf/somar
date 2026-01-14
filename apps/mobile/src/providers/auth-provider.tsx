import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { signIn, signOut, getSession, emailOtp } from "../lib/auth-client";
import { initialOtpState, type OtpState } from "@somar/shared/components";
import { getMe } from "@somar/shared/services";

const OTP_STATE_KEY = "somar_otp_state";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type Session = Awaited<ReturnType<typeof getSession>>["data"];

interface AuthContextValue {
  // Session state (from Better Auth)
  session: Session;
  isLoading: boolean;

  // User approval status
  approvalStatus: ApprovalStatus;
  isApprovalLoading: boolean;
  refreshApprovalStatus: () => Promise<void>;

  // OTP step state (persists across component remounts)
  otpState: OtpState;
  setOtpState: (state: OtpState) => void;
  resetOtpState: () => void;

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
  const router = useRouter();
  const [session, setSession] = useState<Session>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [otpState, setOtpStateInternal] = useState<OtpState>(initialOtpState);
  const [isOtpStateLoaded, setIsOtpStateLoaded] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const [isApprovalLoading, setIsApprovalLoading] = useState(false);

  // Track if we're waiting for OAuth to complete
  const pendingOAuthRef = useRef(false);

  // Fetch session once on mount
  useEffect(() => {
    let mounted = true;
    getSession().then(({ data }) => {
      if (mounted) {
        setSession(data);
        setIsSessionLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Refresh session when app returns to foreground (for OAuth callback)
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === "active" && pendingOAuthRef.current) {
        pendingOAuthRef.current = false;
        const { data } = await getSession();
        if (data?.user) {
          setSession(data);
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Fetch approval status from server using shared service
  const refreshApprovalStatus = useCallback(async () => {
    setIsApprovalLoading(true);
    try {
      const user = await getMe();
      setApprovalStatus(user.status);
    } catch {
      setApprovalStatus(null);
    } finally {
      setIsApprovalLoading(false);
    }
  }, []);

  // Fetch approval status when session changes
  useEffect(() => {
    if (session?.user && !isSessionLoading) {
      refreshApprovalStatus();
    } else if (!session?.user) {
      setApprovalStatus(null);
    }
  }, [session?.user, isSessionLoading, refreshApprovalStatus]);

  // Restore OTP state from SecureStore on mount
  useEffect(() => {
    SecureStore.getItemAsync(OTP_STATE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as OtpState;
            setOtpStateInternal(parsed);
          } catch {
            // Invalid JSON, use initial state
          }
        }
      })
      .catch(() => {
        // Failed to read, use initial state
      })
      .finally(() => {
        setIsOtpStateLoaded(true);
      });
  }, []);

  const setOtpState = useCallback((state: OtpState) => {
    setOtpStateInternal(state);
    SecureStore.setItemAsync(OTP_STATE_KEY, JSON.stringify(state)).catch(() => {
      // Failed to persist, state will still work in memory
    });
  }, []);

  const resetOtpState = useCallback(() => {
    setOtpStateInternal(initialOtpState);
    SecureStore.deleteItemAsync(OTP_STATE_KEY).catch(() => {
      // Failed to clear, not critical
    });
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

      // Categories are seeded server-side when user is created

      // Set verifying state to keep showing loading spinner until navigation completes
      setOtpStateInternal((prev) => ({ ...prev, step: "verifying" }));
      SecureStore.deleteItemAsync(OTP_STATE_KEY).catch(() => {});

      // Refresh session after successful login
      const { data } = await getSession();
      setSession(data);

      router.replace("/(tabs)");
    },
    [router]
  );

  const loginWithGoogle = useCallback(async () => {
    pendingOAuthRef.current = true;
    await signIn.social({
      provider: "google",
      callbackURL: "somar://",
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setOtpStateInternal(initialOtpState);
    SecureStore.deleteItemAsync(OTP_STATE_KEY).catch(() => {});
    router.replace("/(auth)/login");
  }, [router]);

  const value: AuthContextValue = {
    session,
    isLoading: isSessionLoading || !isOtpStateLoaded,
    approvalStatus,
    isApprovalLoading,
    refreshApprovalStatus,
    otpState,
    setOtpState,
    resetOtpState,
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
