import { Tabs } from "expo-router";
import { View, Text, ActivityIndicator, Pressable, Alert } from "react-native";
import { LogOut, House, Activity, Wallet } from "lucide-react-native";
import { useAuth } from "@/src/providers";
import { colors } from "@/src/lib/theme";
import { FloatingTabBar } from "@/src/components/ui/floating-tab-bar";

/**
 * Sign out button for header.
 */
function SignOutButton() {
  const { logout } = useAuth();

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
 * Tab layout with floating tab bar.
 */
export default function TabLayout() {
  return (
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
  );
}
