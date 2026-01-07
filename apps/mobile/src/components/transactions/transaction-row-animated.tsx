import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { formatCurrency } from "@somar/shared";
import type { ThemeColors } from "../../lib/theme";

interface TransactionRowAnimatedProps {
  description: string;
  amount: number;
  date: string;
  categoryName?: string;
  categoryColor?: string;
  isConfirmed: boolean;
  colors: ThemeColors;
  isLast: boolean;
  /** Index for staggered animation */
  index: number;
}

/**
 * Animated transaction row for dashboard "recent activity" sections.
 * Features staggered fade-in animation and inline styles for theme control.
 */
export function TransactionRowAnimated({
  description,
  amount,
  date,
  categoryName,
  categoryColor,
  isConfirmed,
  colors,
  isLast,
  index,
}: TransactionRowAnimatedProps) {
  const isExpense = amount < 0;
  const [, month, day] = date.split("-");

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(400 + index * 50)}
      className="flex-row items-center px-5 py-3.5"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      {/* Category color bar */}
      <View
        className="w-[3px] h-9 rounded mr-3.5"
        style={{ backgroundColor: categoryColor || colors.muted }}
      />

      {/* Details */}
      <View className="flex-1 mr-3">
        <Text className="font-medium text-sm text-foreground" numberOfLines={1}>
          {description}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="font-sans text-xs text-muted-foreground">
            {new Date(2024, parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          {categoryName ? (
            <Text className="font-sans text-xs text-muted-foreground ml-1.5 capitalize">
              · {categoryName}
            </Text>
          ) : (
            <Text className="font-sans text-xs text-primary ml-1.5">
              · Uncategorized
            </Text>
          )}
          {!isConfirmed && (
            <View className="w-1.5 h-1.5 rounded-full bg-primary ml-1.5" />
          )}
        </View>
      </View>

      {/* Amount */}
      <Text
        className={`font-semibold text-sm ${isExpense ? "text-foreground" : "text-success"}`}
      >
        {isExpense ? "-" : "+"}
        {formatCurrency(Math.abs(amount))}
      </Text>
    </Animated.View>
  );
}
