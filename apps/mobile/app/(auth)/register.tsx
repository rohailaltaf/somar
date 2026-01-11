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
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../src/providers";
import { OtpInput } from "../../src/components/ui";
import { colors } from "../../src/lib/theme";
import { authFormStyles, getButtonClass } from "@somar/shared/styles";
import {
  registerEmailSchema,
  otpSchema,
  type RegisterEmailFormData,
  type OtpFormData,
} from "@somar/shared/validation";

export default function RegisterScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, loginWithGoogle, otpState, setOtpState, resetOtpState } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Info form (name + email) - use values from context if available
  const infoForm = useForm<RegisterEmailFormData>({
    resolver: zodResolver(registerEmailSchema),
    defaultValues: { name: otpState.name || "", email: otpState.email || "" },
  });

  // OTP form - use email from context
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: otpState.email || "", otp: "" },
  });

  async function handleInfoSubmit(data: RegisterEmailFormData) {
    try {
      await sendOtp(data.email);
      otpForm.setValue("email", data.email);
      setOtpState({ step: "otp", email: data.email, name: data.name });
    } catch (err) {
      infoForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to send code",
      });
    }
  }

  async function handleOtpSubmit(data: OtpFormData) {
    try {
      // Use name from context (persists across remounts) or fall back to form
      const name = otpState.name || infoForm.getValues("name");
      await verifyOtp(data.email, data.otp, name);
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

  async function handleGoogleRegister() {
    try {
      await loginWithGoogle();
    } catch (err) {
      infoForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to sign up with Google",
      });
    }
  }

  function handleBack() {
    resetOtpState();
    otpForm.reset();
  }

  const isInfoSubmitting = infoForm.formState.isSubmitting;
  const isOtpSubmitting = otpForm.formState.isSubmitting;

  // Loading state - show while submitting OTP or after successful verification (before navigation)
  if (isOtpSubmitting || otpState.step === "verifying") {
    return (
      <View className={authFormStyles.loading.container}>
        <View className={authFormStyles.loading.spinner} />
        <Text className={authFormStyles.loading.text}>Creating your account...</Text>
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
              <Text className={authFormStyles.button.primaryText}>Create account</Text>
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

  // Info step
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
            <Text className={authFormStyles.header.title}>Create an account</Text>
            <Text className={authFormStyles.header.subtitle}>Start tracking your finances securely</Text>
          </View>

          <TouchableOpacity
            onPress={handleGoogleRegister}
            disabled={isInfoSubmitting}
            className={authFormStyles.button.oauth}
          >
            <Text className={authFormStyles.button.oauthText}>Continue with Google</Text>
          </TouchableOpacity>

          <View className={authFormStyles.divider.container}>
            <View className={authFormStyles.divider.line} />
            <Text className={authFormStyles.divider.text}>Or continue with</Text>
            <View className={authFormStyles.divider.line} />
          </View>

          {infoForm.formState.errors.root && (
            <View className={authFormStyles.error.container}>
              <Text className={authFormStyles.error.text}>
                {infoForm.formState.errors.root.message}
              </Text>
            </View>
          )}

          <View className={authFormStyles.field.container}>
            <Text className={authFormStyles.field.label}>Name</Text>
            <Controller
              control={infoForm.control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`${authFormStyles.field.input} w-full px-4 py-3`}
                  placeholder="John Doe"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {infoForm.formState.errors.name && (
              <Text className={authFormStyles.field.error}>
                {infoForm.formState.errors.name.message}
              </Text>
            )}
          </View>

          <View className={authFormStyles.field.container}>
            <Text className={authFormStyles.field.label}>Email</Text>
            <Controller
              control={infoForm.control}
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
            {infoForm.formState.errors.email && (
              <Text className={authFormStyles.field.error}>
                {infoForm.formState.errors.email.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={infoForm.handleSubmit(handleInfoSubmit)}
            disabled={isInfoSubmitting}
            className={getButtonClass(isInfoSubmitting)}
          >
            <Text className={authFormStyles.button.primaryText}>
              {isInfoSubmitting ? "Sending code..." : "Continue"}
            </Text>
          </TouchableOpacity>

          <View className={authFormStyles.footer.container}>
            <Text className={authFormStyles.footer.text}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className={authFormStyles.footer.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
