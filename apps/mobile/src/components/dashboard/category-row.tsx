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
import { hexColors } from "@somar/shared/theme";
import {
  categoryRowStyles,
  getCategoryAmountClass,
  getCategoryStatusClass,
  type CategoryRowProps,
} from "@somar/shared/styles";

/**
 * Category spending row with budget progress visualization.
 * Uses shared styles from @somar/shared/styles.
 */
export function CategoryRow({
  name,
  amount,
  budget,
  color,
  isLast = false,
  index,
}: CategoryRowProps) {
  const isOverBudget = budget ? amount > budget : false;
  const budgetUsed = budget ? (amount / budget) * 100 : null;

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    if (budgetUsed !== null) {
      animatedWidth.value = withDelay(
        500 + index * 60,
        withTiming(Math.min(budgetUsed, 100), {
          duration: 600,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })
      );
    }
  }, [budgetUsed, index, animatedWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  const getProgressColor = () => {
    if (isOverBudget) return hexColors.destructive;
    if (budgetUsed && budgetUsed >= 80) return hexColors.warning;
    return color;
  };

  return (
    <View
      className="px-5 py-4"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: hexColors.borderSubtle,
      }}
    >
      <View className={categoryRowStyles.row}>
        {/* Color indicator */}
        <View
          className={categoryRowStyles.colorDot}
          style={{
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />

        {/* Category info */}
        <View className={categoryRowStyles.content}>
          <View className={categoryRowStyles.header}>
            <Text className={categoryRowStyles.name}>{name}</Text>
            <View className={categoryRowStyles.amountContainer}>
              <Text className={getCategoryAmountClass(isOverBudget)}>
                {formatCurrency(amount)}
              </Text>
              {budget && (
                <Text className={categoryRowStyles.budget}>
                  / {formatCurrency(budget)}
                </Text>
              )}
            </View>
          </View>

          {/* Progress bar - only shown when budget exists */}
          {budget && budgetUsed !== null && (
            <>
              <View className={categoryRowStyles.progressTrack}>
                <Animated.View
                  className={categoryRowStyles.progressBar}
                  style={[{ backgroundColor: getProgressColor() }, animatedStyle]}
                />
              </View>

              <View className={categoryRowStyles.statusContainer}>
                <Text
                  className={`${categoryRowStyles.status} ${getCategoryStatusClass(budgetUsed, isOverBudget)}`}
                >
                  {budgetUsed.toFixed(0)}% of budget
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
