import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { oklchToHex } from "@somar/shared/utils";

interface AnimatedProgressBarProps {
  /** Progress value from 0 to 1 (can exceed 1 for over-budget) */
  progress: number;
  /** Custom bar color (hex). If not provided, auto-determines based on progress */
  color?: string;
  /** Animation delay in ms */
  delay?: number;
  /** Height of the bar */
  height?: number;
  /** Whether to show glow effect */
  showGlow?: boolean;
}

/**
 * Animated progress bar with optional glow effect.
 * Auto-determines color based on progress if not specified.
 */
export function AnimatedProgressBar({
  progress,
  color,
  delay = 300,
  height = 8,
  showGlow = true,
}: AnimatedProgressBarProps) {
  const animatedWidth = useSharedValue(0);
  const clampedProgress = Math.min(progress, 1);

  useEffect(() => {
    animatedWidth.value = withDelay(
      delay,
      withTiming(clampedProgress * 100, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [clampedProgress, delay]);

  const getAutoColor = () => {
    if (progress >= 1) return oklchToHex("oklch(0.6 0.2 25)"); // red
    if (progress >= 0.8) return oklchToHex("oklch(0.75 0.18 75)"); // amber
    return oklchToHex("oklch(0.55 0.18 260)"); // primary
  };

  const barColor = color || getAutoColor();

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View
      className="overflow-hidden"
      style={{
        height,
        backgroundColor: oklchToHex("oklch(0.2 0.02 260)"),
        borderRadius: height / 2,
      }}
    >
      {/* Glow layer */}
      {showGlow && (
        <Animated.View
          className="absolute h-full"
          style={[
            {
              backgroundColor: barColor,
              borderRadius: height / 2,
              opacity: 0.5,
              shadowColor: barColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
            },
            animatedStyle,
          ]}
        />
      )}
      {/* Main bar */}
      <Animated.View
        className="h-full"
        style={[
          {
            backgroundColor: barColor,
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
