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
    <View className="flex-row items-baseline">
      <Text
        className="text-foreground text-[64px] tracking-[-2px] leading-[68px]"
        style={{ fontFamily: "InstrumentSerif_400Regular" }}
      >
        {dollars}
      </Text>
      {cents && (
        <Text
          className="text-muted-foreground text-[32px] ml-1"
          style={{ fontFamily: "InstrumentSerif_400Regular" }}
        >
          .{cents}
        </Text>
      )}
    </View>
  );
}
