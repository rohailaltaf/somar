import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { formatCurrency } from "@somar/shared";
import { oklchToHex } from "@somar/shared/utils";
import type { ThemeColors } from "../../lib/theme";

interface CategoryRowProps {
  name: string;
  spent: number;
  budget: number;
  color: string;
  /** Percentage of total spending this category represents */
  percentage: number;
  colors: ThemeColors;
  isLast: boolean;
  /** Index for staggered animation */
  index: number;
}

/**
 * Category row with animated progress bar.
 * Shows spending vs budget with visual indicators.
 */
export function CategoryRow({
  name,
  spent,
  budget,
  color,
  percentage,
  colors,
  isLast,
  index,
}: CategoryRowProps) {
  const isOverBudget = budget > 0 && spent > budget;
  const budgetUsed = budget > 0 ? (spent / budget) * 100 : null;

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withDelay(
      300 + index * 60,
      withTiming(Math.min(percentage, 100), {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [percentage, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View
      className="px-5 py-4"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center">
          <View
            className="w-3 h-3 rounded-full mr-3"
            style={{
              backgroundColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }}
          />
          <Text className="font-medium text-sm text-foreground capitalize">
            {name}
          </Text>
        </View>
        <View className="flex-row items-baseline">
          <Text
            className={`font-semibold text-sm ${isOverBudget ? "text-destructive" : "text-foreground"}`}
          >
            {formatCurrency(spent)}
          </Text>
          {budget > 0 && (
            <Text className="font-sans text-xs text-muted-foreground ml-1">
              / {formatCurrency(budget)}
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View
        className="h-1.5 rounded overflow-hidden"
        style={{ backgroundColor: oklchToHex("oklch(0.18 0.02 260)") }}
      >
        <Animated.View
          className="h-full rounded"
          style={[{ backgroundColor: color }, animatedStyle]}
        />
      </View>

      {/* Budget indicator */}
      {budgetUsed !== null && (
        <Text
          className="font-medium text-[10px] text-right mt-1.5"
          style={{
            color: isOverBudget
              ? colors.destructive
              : budgetUsed >= 80
              ? colors.warning
              : colors.mutedForeground,
          }}
        >
          {budgetUsed.toFixed(0)}% of budget
        </Text>
      )}
    </View>
  );
}
