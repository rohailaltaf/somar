import { Tabs } from "expo-router";
import { View, Text, ActivityIndicator, Pressable, Alert } from "react-native";
import { useColorScheme } from "nativewind";
import { LogOut, LayoutGrid, Receipt } from "lucide-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth, DatabaseProvider } from "@/src/providers";
import { themeColors } from "@/src/lib/theme";

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
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingTop: 8,
            height: 88,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginTop: 4,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, focused }) => (
              <LayoutGrid
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 1.5}
              />
            ),
            headerRight: () => <SignOutButton />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, focused }) => (
              <Receipt
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 1.5}
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
