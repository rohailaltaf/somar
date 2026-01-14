import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth, ApiProvider } from "../src/providers";

// Create query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Loading screen shown while auth is being checked.
 */
function LoadingScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" className="text-primary" />
    </View>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, approvalStatus, isApprovalLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isApprovalLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(tabs)";
    const inWaitlistGroup = firstSegment === "(waitlist)";

    if (!session?.user && !inAuthGroup) {
      // Not signed in and not on auth page - redirect to login
      router.replace("/(auth)/login" as Href);
    } else if (session?.user) {
      const isApproved = approvalStatus === "APPROVED";

      if (isApproved) {
        // Approved user
        if (inAuthGroup || inWaitlistGroup) {
          // On auth or waitlist page - redirect to tabs
          router.replace("/(tabs)" as Href);
        } else if (!inTabsGroup) {
          // Signed in but at root - redirect to tabs
          router.replace("/(tabs)" as Href);
        }
      } else {
        // Not approved (pending or rejected)
        if (!inWaitlistGroup && !inAuthGroup) {
          // Not on waitlist page - redirect to waitlist
          router.replace("/(waitlist)" as Href);
        }
      }
    }
  }, [session, segments, isLoading, isApprovalLoading, approvalStatus, router]);

  // Show loading while checking auth or approval status
  if (isLoading || (session?.user && isApprovalLoading)) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

function RootLayoutContent() {
  return (
    <AuthGuard>
      <StatusBar style="light" />
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
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  // Show nothing while fonts load (or could show splash screen)
  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiProvider>
          <RootLayoutContent />
        </ApiProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
