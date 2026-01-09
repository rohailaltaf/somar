import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { formatCurrency } from "@somar/shared";
import { hexColors } from "@somar/shared/theme";
import { transactionRowCompactStyles } from "@somar/shared/styles";

interface TransactionRowAnimatedProps {
  description: string;
  amount: number;
  date: string;
  categoryName?: string;
  categoryColor?: string;
  isConfirmed: boolean;
  isLast: boolean;
  /** Index for staggered animation */
  index: number;
}

/**
 * Animated transaction row for dashboard "recent activity" sections.
 * Uses shared styles from @somar/shared/styles.
 */
export function TransactionRowAnimated({
  description,
  amount,
  date,
  categoryName,
  categoryColor,
  isConfirmed,
  isLast,
  index,
}: TransactionRowAnimatedProps) {
  const isExpense = amount < 0;
  const [, month, day] = date.split("-");

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(400 + index * 50)}
      className={transactionRowCompactStyles.container}
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: hexColors.borderSubtle,
      }}
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

      {/* Amount */}
      <Text
        className={`${transactionRowCompactStyles.amount} ${isExpense ? transactionRowCompactStyles.amountExpense : transactionRowCompactStyles.amountIncome}`}
      >
        {isExpense ? "-" : "+"}
        {formatCurrency(Math.abs(amount))}
      </Text>
    </Animated.View>
  );
}
