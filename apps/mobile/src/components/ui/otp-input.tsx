import { useRef, useCallback } from "react";
import { View, TextInput } from "react-native";
import type { OtpInputProps } from "@somar/shared/components";
import { authFormStyles } from "@somar/shared/styles";
import { cn } from "../../lib/utils";

/**
 * OTP Input component for mobile.
 * Mirrors the web implementation exactly.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Convert value string to array of digits
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = useCallback(
    (index: number, newValue: string) => {
      const cleaned = newValue.replace(/\D/g, "");

      // Handle paste: if multiple digits, fill from current index
      if (cleaned.length > 1) {
        const pastedDigits = cleaned.slice(0, length - index).split("");
        const newDigits = [...digits];
        pastedDigits.forEach((d, i) => {
          newDigits[index + i] = d;
        });
        const newOtp = newDigits.join("");
        onChange(newOtp);

        // Auto-submit when complete
        if (newOtp.length === length && onComplete) {
          onComplete(newOtp);
        }

        const focusIndex = Math.min(index + pastedDigits.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
        return;
      }

      // Single digit entry
      const digit = cleaned.slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      const newOtp = newDigits.join("");
      onChange(newOtp);

      // Auto-submit when complete
      if (newOtp.length === length && onComplete) {
        onComplete(newOtp);
      }

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, length, onChange, onComplete]
  );

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === "Backspace" && !digits[index] && index > 0) {
        // Move focus to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  return (
    <View className={authFormStyles.otp.container}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={(text) => handleChange(index, text)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
          editable={!disabled}
          selectTextOnFocus
          className={cn(
            authFormStyles.otp.slot,
            hasError && authFormStyles.otp.slotError
          )}
          accessibilityLabel={`Digit ${index + 1}`}
        />
      ))}
    </View>
  );
}
