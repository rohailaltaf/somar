import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import LottieView from "lottie-react-native";
import * as Haptics from "expo-haptics";

// Minimum time to show the decrypting screen (ms)
const MIN_DISPLAY_TIME = 1500;

interface DecryptingScreenProps {
  /** Called when minimum display time has elapsed and animation is ready to transition */
  onReady?: () => void;
}

/**
 * A delightful decrypting screen shown while the encryption key is being derived.
 * Features a Lottie lock animation and haptic feedback.
 */
export function DecryptingScreen({ onReady }: DecryptingScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, MIN_DISPLAY_TIME);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed && onReady) {
      onReady();
    }
  }, [minTimeElapsed, onReady]);

  return (
    <View className="flex-1 bg-background justify-center items-center p-6">
      <LottieView
        source={require("../../../assets/animations/lock-unlock.json")}
        autoPlay
        loop
        style={{ width: 180, height: 180 }}
      />

      <Text className="text-2xl font-bold text-foreground text-center mt-6 mb-2">
        Unlocking your vault...
      </Text>

      <Text className="text-sm text-muted-foreground text-center px-8">
        Your finances, your eyes only
      </Text>
    </View>
  );
}
