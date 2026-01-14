/**
 * OTP Input component contract.
 * Used by both web and mobile OTP input implementations.
 */

export interface OtpInputProps {
  /** Current OTP value */
  value: string;
  /** Callback when OTP value changes */
  onChange: (value: string) => void;
  /** Callback when OTP is complete (all digits entered) */
  onComplete?: (value: string) => void;
  /** Number of OTP digits (default: 6) */
  length?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show error state */
  hasError?: boolean;
}
