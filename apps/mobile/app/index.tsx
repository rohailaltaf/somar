import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../src/providers";

function LoadingScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function Index() {
  const { session, isLoading, approvalStatus, isApprovalLoading } = useAuth();

  if (isLoading || (session?.user && isApprovalLoading)) {
    return <LoadingScreen />;
  }

  if (!session?.user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (approvalStatus === "APPROVED") {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(waitlist)" />;
}
