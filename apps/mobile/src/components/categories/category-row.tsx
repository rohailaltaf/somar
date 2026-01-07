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
      style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: color,
              marginRight: 12,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }}
          />
          <Text
            style={{
              fontFamily: "DMSans_500Medium",
              fontSize: 14,
              color: colors.foreground,
              textTransform: "capitalize",
            }}
          >
            {name}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text
            style={{
              fontFamily: "DMSans_600SemiBold",
              fontSize: 14,
              color: isOverBudget ? colors.destructive : colors.foreground,
            }}
          >
            {formatCurrency(spent)}
          </Text>
          {budget > 0 && (
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 12,
                color: colors.mutedForeground,
                marginLeft: 4,
              }}
            >
              / {formatCurrency(budget)}
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 6,
          backgroundColor: oklchToHex("oklch(0.18 0.02 260)"),
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            {
              height: "100%",
              backgroundColor: color,
              borderRadius: 4,
            },
            animatedStyle,
          ]}
        />
      </View>

      {/* Budget indicator */}
      {budgetUsed !== null && (
        <Text
          style={{
            fontFamily: "DMSans_500Medium",
            fontSize: 10,
            color: isOverBudget
              ? colors.destructive
              : budgetUsed >= 80
              ? colors.warning
              : colors.mutedForeground,
            textAlign: "right",
            marginTop: 6,
          }}
        >
          {budgetUsed.toFixed(0)}% of budget
        </Text>
      )}
    </View>
  );
}
