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
  length = 6,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

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

      // Move focus to next input if digit was entered
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, length, onChange]
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
