/**
 * Auth provider contract.
 * Shared types for authentication state and actions across web and mobile.
 */

/**
 * OTP flow step.
 * - "email": Enter email
 * - "otp": Enter OTP code
 * - "verifying": OTP verified, navigating to app
 */
export type OtpStep = "email" | "otp" | "verifying";

/**
 * OTP flow state.
 * Persisted to survive component remounts (sessionStorage on web, SecureStore on mobile).
 */
export interface OtpState {
  step: OtpStep;
  email: string;
}

/**
 * Initial OTP state.
 */
export const initialOtpState: OtpState = {
  step: "email",
  email: "",
};
