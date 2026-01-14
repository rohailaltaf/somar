import { Stack } from "expo-router";

export default function WaitlistLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "transparent",
        },
      }}
    />
  );
}
