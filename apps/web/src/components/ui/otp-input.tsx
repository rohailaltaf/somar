"use client";

import { useRef, useCallback } from "react";
import type { OtpInputProps } from "@somar/shared/components";
import { authFormStyles } from "@somar/shared/styles";
import { cn } from "@/lib/utils";

/**
 * OTP Input component for web.
 * Mirrors the mobile implementation exactly.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Convert value string to array of digits
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = useCallback(
    (index: number, newValue: string) => {
      // Only allow digits
      const digit = newValue.replace(/\D/g, "").slice(-1);

      // Build new value
      const newDigits = [...digits];
      newDigits[index] = digit;
      const newOtp = newDigits.join("");
      onChange(newOtp);

      // Auto-submit when complete
      if (newOtp.length === length && onComplete) {
        onComplete(newOtp);
      }

      // Move focus to next input if digit was entered
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, length, onChange, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        // Move focus to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      onChange(pastedData);

      // Auto-submit when complete
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData);
      }

      // Focus the next empty slot or last slot
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    },
    [length, onChange, onComplete]
  );

  return (
    <div className={authFormStyles.otp.container}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            authFormStyles.otp.slot,
            hasError && authFormStyles.otp.slotError
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
