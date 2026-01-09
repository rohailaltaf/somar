import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAmountDisplay } from "@somar/shared/ui-logic";
import { hexColors } from "@somar/shared/theme";
import { transactionRowCompactStyles } from "@somar/shared/styles";

interface TransactionRowProps {
  description: string;
  amount: number;
  date: string;
  categoryName?: string;
  categoryColor?: string;
  isConfirmed: boolean;
  /** Index for staggered animation */
  index: number;
}

/**
 * Transaction row for dashboard "recent activity" sections.
 * Uses shared styles from @somar/shared/styles.
 */
export function TransactionRow({
  description,
  amount,
  date,
  categoryName,
  categoryColor,
  isConfirmed,
  index,
}: TransactionRowProps) {
  // Use shared hook for amount display - uses display for parity with web
  const { display, colorClass } = useAmountDisplay(amount, { showSign: true });
  const [, month, day] = date.split("-");

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(400 + index * 50)}
      className={transactionRowCompactStyles.container}
    >
      {/* Category color bar */}
      <View
        className={transactionRowCompactStyles.colorBar}
        style={{ backgroundColor: categoryColor || hexColors.muted }}
      />

      {/* Details */}
      <View className="flex-1 mr-3">
        <Text className={transactionRowCompactStyles.description} numberOfLines={1}>
          {description}
        </Text>
        <View className={transactionRowCompactStyles.meta}>
          <Text className={transactionRowCompactStyles.date}>
            {new Date(2024, parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          {categoryName ? (
            <Text className={transactionRowCompactStyles.category}>
              · {categoryName}
            </Text>
          ) : (
            <Text className={transactionRowCompactStyles.uncategorized}>
              · Uncategorized
            </Text>
          )}
          {!isConfirmed && (
            <View className={transactionRowCompactStyles.unconfirmedDot} />
          )}
        </View>
      </View>

      {/* Amount - uses shared display for parity with web */}
      <Text className={`${transactionRowCompactStyles.amount} ${colorClass}`}>
        {display}
      </Text>
    </Animated.View>
  );
}
