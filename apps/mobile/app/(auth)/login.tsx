import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../src/providers";
import { OtpInput } from "../../src/components/ui";
import { colors } from "../../src/lib/theme";
import { authFormStyles, getButtonClass } from "@somar/shared/styles";
import {
  emailSchema,
  otpSchema,
  type EmailFormData,
  type OtpFormData,
} from "@somar/shared/validation";

export default function LoginScreen() {
  const { sendOtp, verifyOtp, loginWithGoogle, otpState, setOtpState, resetOtpState } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Email form - use email from context if available
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: otpState.email || "" },
  });

  // OTP form - use email from context
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: otpState.email || "", otp: "" },
  });

  async function handleEmailSubmit(data: EmailFormData) {
    try {
      await sendOtp(data.email);
      otpForm.setValue("email", data.email);
      setOtpState({ step: "otp", email: data.email });
    } catch (err) {
      emailForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to send code",
      });
    }
  }

  async function handleOtpSubmit(data: OtpFormData) {
    try {
      await verifyOtp(data.email, data.otp);
    } catch (err) {
      otpForm.setError("root", {
        message: err instanceof Error ? err.message : "Invalid code",
      });
    }
  }

  async function handleResendCode() {
    setIsResending(true);
    try {
      await sendOtp(otpForm.getValues("email"));
    } catch (err) {
      otpForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to resend code",
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      await loginWithGoogle();
    } catch (err) {
      emailForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to sign in with Google",
      });
    }
  }

  function handleBack() {
    resetOtpState();
    otpForm.reset();
  }

  const isEmailSubmitting = emailForm.formState.isSubmitting;
  const isOtpSubmitting = otpForm.formState.isSubmitting;

  // Loading state - show while submitting OTP or after successful verification (before navigation)
  if (isOtpSubmitting || otpState.step === "verifying") {
    return (
      <View className={authFormStyles.loading.container}>
        <View className={authFormStyles.loading.spinner} />
        <Text className={authFormStyles.loading.text}>Signing in...</Text>
        <Text className={authFormStyles.loading.subtext}>Please wait</Text>
      </View>
    );
  }

  // OTP step
  if (otpState.step === "otp") {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className={`${authFormStyles.cardWithBack} relative`}>
            <TouchableOpacity
              onPress={handleBack}
              className={authFormStyles.backButton.container}
            >
              <Text className={authFormStyles.backButton.text}>← Back</Text>
            </TouchableOpacity>

            <View className={authFormStyles.header.container}>
              <Text className={authFormStyles.header.title}>Check your email</Text>
              <Text className={authFormStyles.header.subtitle}>
                We sent a code to {otpForm.watch("email")}
              </Text>
            </View>

            {otpForm.formState.errors.root && (
              <View className={authFormStyles.error.container}>
                <Text className={authFormStyles.error.text}>
                  {otpForm.formState.errors.root.message}
                </Text>
              </View>
            )}

            <OtpInput
              value={otpForm.watch("otp")}
              onChange={(value) => otpForm.setValue("otp", value)}
              hasError={!!otpForm.formState.errors.otp}
            />

            <TouchableOpacity
              onPress={otpForm.handleSubmit(handleOtpSubmit)}
              disabled={otpForm.watch("otp").length !== 6 || isOtpSubmitting}
              className={getButtonClass(otpForm.watch("otp").length !== 6 || isOtpSubmitting)}
            >
              <Text className={authFormStyles.button.primaryText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isOtpSubmitting || isResending}
              className={authFormStyles.button.ghost}
            >
              <Text className={authFormStyles.button.ghostText}>
                {isResending ? "Sending..." : "Resend code"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Email step
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className={authFormStyles.card}>
          <View className={authFormStyles.header.container}>
            <Text className={authFormStyles.header.title}>Welcome back</Text>
            <Text className={authFormStyles.header.subtitle}>Sign in to access your finances</Text>
          </View>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={isEmailSubmitting}
            className={authFormStyles.button.oauth}
          >
            <Text className={authFormStyles.button.oauthText}>Continue with Google</Text>
          </TouchableOpacity>

          <View className={authFormStyles.divider.container}>
            <View className={authFormStyles.divider.line} />
            <Text className={authFormStyles.divider.text}>Or continue with</Text>
            <View className={authFormStyles.divider.line} />
          </View>

          {emailForm.formState.errors.root && (
            <View className={authFormStyles.error.container}>
              <Text className={authFormStyles.error.text}>
                {emailForm.formState.errors.root.message}
              </Text>
            </View>
          )}

          <View className={authFormStyles.field.container}>
            <Text className={authFormStyles.field.label}>Email</Text>
            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`${authFormStyles.field.input} w-full px-4 py-3`}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {emailForm.formState.errors.email && (
              <Text className={authFormStyles.field.error}>
                {emailForm.formState.errors.email.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={emailForm.handleSubmit(handleEmailSubmit)}
            disabled={isEmailSubmitting}
            className={getButtonClass(isEmailSubmitting)}
          >
            <Text className={authFormStyles.button.primaryText}>
              {isEmailSubmitting ? "Sending code..." : "Continue with email"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
