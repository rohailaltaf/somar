import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { formatCurrency } from "@somar/shared";
import type { AnimatedCurrencyProps } from "@somar/shared/components";
import { animatedCurrencyStyles } from "@somar/shared/styles";

/**
 * Animated currency display with counting animation.
 * Uses shared styles from @somar/shared/styles.
 */
export function AnimatedCurrency({
  value,
  duration = 1500,
}: AnimatedCurrencyProps) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, animatedValue]);

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

  // Use Math.abs to ensure positive values (caller should handle sign display)
  const formatted = formatCurrency(Math.abs(displayValue));
  const [dollars, cents] = formatted.split(".");

  return (
    <View className={animatedCurrencyStyles.container}>
      <Text
        className={`${animatedCurrencyStyles.sizes.hero.dollars} ${animatedCurrencyStyles.dollars} ${animatedCurrencyStyles.dollarsColor}`}
        style={{ fontFamily: animatedCurrencyStyles.fontFamily.mobile }}
      >
        {dollars}
      </Text>
      {cents && (
        <Text
          className={`${animatedCurrencyStyles.sizes.hero.cents} ${animatedCurrencyStyles.cents} ${animatedCurrencyStyles.centsColor}`}
          style={{ fontFamily: animatedCurrencyStyles.fontFamily.mobile }}
        >
          .{cents}
        </Text>
      )}
    </View>
  );
}
