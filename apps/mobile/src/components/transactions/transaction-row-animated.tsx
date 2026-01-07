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
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      {/* Category color bar */}
      <View
        style={{
          width: 3,
          height: 36,
          borderRadius: 4,
          backgroundColor: categoryColor || colors.muted,
          marginRight: 14,
        }}
      />

      {/* Details */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            fontFamily: "DMSans_500Medium",
            fontSize: 14,
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {description}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 12,
              color: colors.mutedForeground,
            }}
          >
            {new Date(2024, parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          {categoryName ? (
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 12,
                color: colors.mutedForeground,
                marginLeft: 6,
                textTransform: "capitalize",
              }}
            >
              · {categoryName}
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 12,
                color: colors.primary,
                marginLeft: 6,
              }}
            >
              · Uncategorized
            </Text>
          )}
          {!isConfirmed && (
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.primary,
                marginLeft: 6,
              }}
            />
          )}
        </View>
      </View>

      {/* Amount */}
      <Text
        style={{
          fontFamily: "DMSans_600SemiBold",
          fontSize: 14,
          color: isExpense ? colors.foreground : colors.success,
        }}
      >
        {isExpense ? "-" : "+"}
        {formatCurrency(Math.abs(amount))}
      </Text>
    </Animated.View>
  );
}
