import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../src/providers";
import { FormTextInput } from "../../src/components/ui";
import { emailSchema, type EmailFormData } from "@somar/shared/validation";
import { colors } from "../../src/lib/theme";

type Step = "email" | "otp";

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  async function handleEmailSubmit(data: EmailFormData) {
    setIsSubmitting(true);
    setError(null);
    try {
      await sendOtp(data.email);
      setEmail(data.email);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit() {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await verifyOtp(email, otpValue);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    setIsSubmitting(true);
    setError(null);
    try {
      await sendOtp(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle();
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
      setIsSubmitting(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, "");
      setOtp(newOtp);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  const isDisabled = isSubmitting;
  const otpComplete = otp.every((digit) => digit !== "");

  // OTP verification step
  if (step === "otp") {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-card rounded-xl p-6 border border-border">
            <TouchableOpacity
              className="mb-4"
              onPress={() => {
                setStep("email");
                setOtp(["", "", "", "", "", ""]);
                setError(null);
              }}
            >
              <Text className="text-muted-foreground text-sm">← Back</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-foreground text-center mb-2">
              Check your email
            </Text>
            <Text className="text-sm text-muted-foreground text-center mb-6">
              We sent a code to {email}
            </Text>

            {error && (
              <View className="bg-destructive/10 border border-destructive rounded-lg p-3 mb-4">
                <Text className="text-destructive text-sm text-center">{error}</Text>
              </View>
            )}

            <View className="flex-row justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpRefs.current[index] = ref)}
                  className="w-12 h-14 border border-border rounded-lg text-center text-xl text-foreground bg-surface-elevated"
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              className={`bg-primary py-3.5 rounded-lg items-center ${!otpComplete || isDisabled ? "opacity-70" : ""}`}
              onPress={handleOtpSubmit}
              disabled={!otpComplete || isDisabled}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text className="text-primary-foreground text-base font-semibold">
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 items-center mt-2"
              onPress={handleResendCode}
              disabled={isDisabled}
            >
              <Text className="text-muted-foreground text-sm">Resend code</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Email entry step
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-card rounded-xl p-6 border border-border">
          <Text className="text-2xl font-bold text-foreground text-center mb-2">
            Welcome back
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">
            Sign in to access your finances
          </Text>

          <TouchableOpacity
            className="bg-foreground py-3 px-4 rounded-lg items-center mb-6"
            onPress={handleGoogleLogin}
            disabled={isDisabled}
          >
            <Text className="text-background text-base font-semibold">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-muted-foreground px-3 text-xs uppercase">
              Or continue with
            </Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <FormTextInput
            control={control}
            name="email"
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && (
            <View className="bg-destructive/10 border border-destructive rounded-lg p-3 mb-4">
              <Text className="text-destructive text-sm text-center">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`bg-primary py-3.5 rounded-lg items-center mt-2 ${isDisabled ? "opacity-70" : ""}`}
            onPress={handleSubmit(handleEmailSubmit)}
            disabled={isDisabled}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className="text-primary-foreground text-base font-semibold">
                Continue with email
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-muted-foreground text-sm">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="text-primary text-sm">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
