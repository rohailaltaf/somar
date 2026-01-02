import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../src/providers";
import { signIn } from "../../src/lib/auth-client";
import { FormTextInput } from "../../src/components/ui";
import { registerSchema, type RegisterFormData } from "../../src/lib/validation";
import { themeColors } from "../../src/lib/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = themeColors[colorScheme ?? "light"];
  const { register } = useAuth();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isDisabled = isSubmitting || isOAuthLoading;

  async function onSubmit(data: RegisterFormData) {
    try {
      await register(data.email, data.password, data.name);
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "An error occurred during registration",
      });
    }
  }

  async function handleGoogleRegister() {
    setIsOAuthLoading(true);
    try {
      await signIn.social({ provider: "google" });
      router.replace("/(tabs)");
    } catch (error) {
      setError("root", { message: "Failed to sign up with Google" });
      console.error(error);
    } finally {
      setIsOAuthLoading(false);
    }
  }

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
            Create an account
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">
            Start tracking your finances securely
          </Text>

          <TouchableOpacity
            className="bg-foreground py-3 px-4 rounded-lg items-center mb-6"
            onPress={handleGoogleRegister}
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
            name="name"
            label="Name"
            placeholder="John Doe"
            autoCapitalize="words"
          />

          <FormTextInput
            control={control}
            name="email"
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormTextInput
            control={control}
            name="password"
            label="Password"
            placeholder="••••••••"
            secureTextEntry
          />

          <FormTextInput
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="••••••••"
            secureTextEntry
          />

          {errors.root && (
            <View className="bg-destructive/10 border border-destructive rounded-lg p-3 mb-4">
              <Text className="text-destructive text-sm text-center">
                {errors.root.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            className={`bg-primary py-3.5 rounded-lg items-center mt-2 ${isDisabled ? "opacity-70" : ""}`}
            onPress={handleSubmit(onSubmit)}
            disabled={isDisabled}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className="text-primary-foreground text-base font-semibold">
                Create account
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-muted-foreground text-sm">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="text-primary text-sm">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
