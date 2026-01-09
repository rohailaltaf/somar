import { Tabs } from "expo-router";
import { View, Text, ActivityIndicator, Pressable, Alert } from "react-native";
import { useColorScheme } from "nativewind";
import { LogOut, House, Activity, Wallet } from "lucide-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth, DatabaseProvider } from "@/src/providers";
import { themeColors } from "@/src/lib/theme";
import { FloatingTabBar } from "@/src/components/ui/floating-tab-bar";

/**
 * Sign out button for header.
 */
function SignOutButton() {
  const { logout } = useAuth();
  const { colorScheme } = useColorScheme();
  const colors = themeColors[colorScheme ?? "light"];

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  return (
    <Pressable onPress={handleSignOut} className="mr-4 p-2">
      <LogOut size={22} color={colors.mutedForeground} />
    </Pressable>
  );
}

/**
 * Loading screen shown while database is initializing.
 */
function LoadingScreen() {
  const { colorScheme } = useColorScheme();
  const colors = themeColors[colorScheme ?? "light"];

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text className="text-base font-medium text-foreground mb-1">
        Loading your data
      </Text>
      <Text className="text-sm text-muted-foreground">
        Decrypting your finances...
      </Text>
    </View>
  );
}

/**
 * Wraps tab content with DatabaseProvider.
 * Only renders when encryption key is available.
 */
function DatabaseGate({ children }: { children: React.ReactNode }) {
  const { encryptionKey, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!encryptionKey) {
    // This shouldn't happen - AuthGuard should redirect to login
    return <LoadingScreen />;
  }

  return (
    <DatabaseProvider encryptionKey={encryptionKey}>
      {children}
    </DatabaseProvider>
  );
}

/**
 * Tab navigator content with icons and styling.
 */
function TabNavigator() {
  const { colorScheme } = useColorScheme();
  const colors = themeColors[colorScheme ?? "light"];

  return (
    <DatabaseGate>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props as any} />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
            shadowColor: "transparent",
            elevation: 0,
          },
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 17,
          },
          headerTintColor: colors.foreground,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarActiveTintColor: colors.foreground,
          tabBarInactiveTintColor: colors.mutedForeground,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <House
                size={20}
                color={color}
                strokeWidth={focused ? 2.25 : 1.75}
              />
            ),
            headerRight: () => <SignOutButton />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Activity",
            tabBarIcon: ({ color, focused }) => (
              <Activity
                size={20}
                color={color}
                strokeWidth={focused ? 2.25 : 1.75}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: "Wallet",
            tabBarIcon: ({ color, focused }) => (
              <Wallet
                size={20}
                color={color}
                strokeWidth={focused ? 2.25 : 1.75}
              />
            ),
          }}
        />
      </Tabs>
    </DatabaseGate>
  );
}

/**
 * Tab layout with providers.
 */
export default function TabLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TabNavigator />
    </QueryClientProvider>
  );
}
