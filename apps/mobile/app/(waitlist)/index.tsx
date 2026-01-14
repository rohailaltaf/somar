import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../src/providers";
import { authFormStyles } from "@somar/shared/styles";

export default function WaitlistScreen() {
  const { session, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View className={authFormStyles.loading.container}>
        <View className={authFormStyles.loading.spinner} />
      </View>
    );
  }

  return (
    <View className={authFormStyles.waitlist.wrapper}>
      <View className={authFormStyles.card}>
        <View className={authFormStyles.header.container}>
          <Text className={authFormStyles.header.title}>You're on the list</Text>
          <Text className={authFormStyles.header.subtitle}>
            We'll let you know when your account is approved
          </Text>
        </View>

        <View className={authFormStyles.waitlist.emailBox}>
          <Text className={authFormStyles.waitlist.emailLabel}>Signed in as</Text>
          <Text className={authFormStyles.waitlist.emailValue}>{session?.user?.email}</Text>
        </View>

        <Text className={authFormStyles.waitlist.description}>
          You'll receive an email at this address once you're approved. This usually happens within 24 hours.
        </Text>

        <TouchableOpacity
          onPress={logout}
          className={authFormStyles.button.ghost}
        >
          <Text className={authFormStyles.button.ghostText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
