import "../global.css";
import { useEffect, useState, useCallback } from "react";
import { Stack, useRouter, useSegments, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthProvider, useAuth } from "../src/providers";
import { FormTextInput, DecryptingScreen } from "../src/components/ui";
import { unlockSchema, type UnlockFormData } from "../src/lib/validation";

/**
 * Unlock prompt shown when user has a session but no encryption key.
 */
function UnlockPrompt() {
  const { session, unlock, logout } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<UnlockFormData>({
    resolver: zodResolver(unlockSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onSubmit(data: UnlockFormData) {
    try {
      await unlock(data.password);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to unlock"
      );
    }
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background justify-center p-6"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="bg-card rounded-xl p-6 border border-border">
        <Text className="text-2xl font-bold text-foreground text-center mb-2">
          Unlock Your Data
        </Text>
        <Text className="text-sm text-muted-foreground text-center mb-6">
          Welcome back, {session?.user?.name || session?.user?.email}! Enter
          your password to decrypt your data.
        </Text>

        <FormTextInput
          control={control}
          name="password"
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          autoFocus
        />

        <TouchableOpacity
          className={`bg-primary py-3.5 rounded-lg items-center ${isSubmitting ? "opacity-70" : ""}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-primary-foreground text-base font-semibold">
              Unlock
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={handleSignOut}
        >
          <Text className="text-muted-foreground text-sm">
            Sign out instead
          </Text>
        </TouchableOpacity>

        <Text className="text-xs text-muted-foreground text-center mt-4">
          Your data is encrypted with your password.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, needsUnlock, isDecrypting } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Track whether to show decrypting screen (persists until min time elapsed)
  const [showDecrypting, setShowDecrypting] = useState(false);
  const [minTimeReady, setMinTimeReady] = useState(false);

  // Start showing decrypting screen when isDecrypting becomes true
  useEffect(() => {
    if (isDecrypting) {
      setShowDecrypting(true);
      setMinTimeReady(false);
    }
  }, [isDecrypting]);

  // Hide decrypting screen when both: min time elapsed AND decryption complete
  useEffect(() => {
    if (minTimeReady && !isDecrypting) {
      setShowDecrypting(false);
    }
  }, [minTimeReady, isDecrypting]);

  const handleDecryptingReady = useCallback(() => {
    setMinTimeReady(true);
  }, []);

  useEffect(() => {
    if (isLoading || showDecrypting) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(tabs)";

    if (!session?.user && !inAuthGroup) {
      // Not signed in and not on auth page - redirect to login
      router.replace("/(auth)/login" as Href);
    } else if (session?.user && inAuthGroup && !needsUnlock) {
      // Signed in and on auth page (and has key) - redirect to tabs
      router.replace("/(tabs)" as Href);
    } else if (session?.user && !inTabsGroup && !inAuthGroup && !needsUnlock) {
      // Signed in but at root (and has key) - redirect to tabs
      router.replace("/(tabs)" as Href);
    }
  }, [session, segments, isLoading, needsUnlock, showDecrypting, router]);

  // Show decrypting screen during login/register (with minimum display time)
  if (showDecrypting) {
    return <DecryptingScreen onReady={handleDecryptingReady} />;
  }

  // Show unlock prompt if authenticated but missing encryption key
  if (needsUnlock) {
    return <UnlockPrompt />;
  }

  return <>{children}</>;
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <AuthGuard>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      />
    </AuthGuard>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
