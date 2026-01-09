import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import {
  progressBarStyles,
  getProgressBarHexColor,
  type ProgressBarProps,
} from "@somar/shared/styles";

/**
 * Animated progress bar with glow effect.
 * Uses shared styles from @somar/shared/styles.
 */
export function ProgressBar({ percentage }: ProgressBarProps) {
  const barColor = getProgressBarHexColor(percentage);
  const clampedPercentage = Math.min(percentage, 100);
  const { animation } = progressBarStyles;

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withDelay(
      animation.delay,
      withTiming(clampedPercentage, {
        duration: animation.duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [clampedPercentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View className={`relative ${progressBarStyles.trackHeight} ${progressBarStyles.track} ${progressBarStyles.trackBackground}`}>
      {/* Glow layer - uses native shadow instead of CSS blur */}
      <Animated.View
        className={`${progressBarStyles.barAbsolute} ${progressBarStyles.bar}`}
        style={[
          {
            backgroundColor: barColor,
            opacity: 0.5,
            shadowColor: barColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
          },
          animatedStyle,
        ]}
      />
      {/* Main bar */}
      <Animated.View
        className={`${progressBarStyles.barAbsolute} ${progressBarStyles.bar}`}
        style={[{ backgroundColor: barColor }, animatedStyle]}
      />
    </View>
  );
}
