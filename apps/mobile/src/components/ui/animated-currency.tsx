import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { formatCurrency } from "@somar/shared";
import type { ThemeColors } from "../../lib/theme";

interface AnimatedCurrencyProps {
  value: number;
  colors: ThemeColors;
  /** Animation duration in ms */
  duration?: number;
}

/**
 * Animated currency display with counting animation.
 * Uses Instrument Serif font for visual hierarchy.
 */
export function AnimatedCurrency({
  value,
  colors,
  duration = 1200,
}: AnimatedCurrencyProps) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentVal = animatedValue.value;
      setDisplayValue(Math.round(currentVal));
    }, 16);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayValue(value);
    }, duration + 100);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [value, duration, animatedValue]);

  const formatted = formatCurrency(displayValue);
  const [dollars, cents] = formatted.split(".");

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text
        style={{
          fontFamily: "InstrumentSerif_400Regular",
          fontSize: 64,
          color: colors.foreground,
          letterSpacing: -2,
          lineHeight: 68,
        }}
      >
        {dollars}
      </Text>
      {cents && (
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular",
            fontSize: 32,
            color: colors.mutedForeground,
            marginLeft: 4,
          }}
        >
          .{cents}
        </Text>
      )}
    </View>
  );
}
