import { View, Text, Pressable } from "react-native";
import { useMemo } from "react";
import { formatDate, type TransactionWithRelations } from "@somar/shared";
import { AmountDisplay } from "./amount-display";

interface TransactionRowProps {
  transaction: TransactionWithRelations;
  onPress?: () => void;
  /** Show full date instead of relative */
  showFullDate?: boolean;
}

export function TransactionRow({
  transaction,
  onPress,
  showFullDate = false,
}: TransactionRowProps) {
  const dateLabel = useMemo(
    () =>
      formatDate(transaction.date, {
        relative: !showFullDate,
        showYear: showFullDate ? "auto" : "never",
      }),
    [transaction.date, showFullDate]
  );

  const category = transaction.category;
  const isUnconfirmed = !transaction.isConfirmed;

  return (
    <Pressable
      className="flex-row items-center px-5 py-4 active:bg-muted/50"
      onPress={onPress}
    >
      {/* Details */}
      <View className="flex-1 mr-4">
        <View className="flex-row items-center">
          <Text
            className="text-base font-medium text-foreground"
            numberOfLines={1}
          >
            {transaction.description}
          </Text>
          {isUnconfirmed && (
            <View className="ml-2 w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </View>

        <View className="flex-row items-center mt-1">
          {category ? (
            <Text
              className="text-sm"
              style={{ color: category.color }}
              numberOfLines={1}
            >
              {category.name}
            </Text>
          ) : (
            <Text className="text-sm text-muted-foreground">
              Uncategorized
            </Text>
          )}
          <Text className="text-sm text-muted-foreground mx-1.5">·</Text>
          <Text className="text-sm text-muted-foreground">{dateLabel}</Text>
        </View>
      </View>

      {/* Amount */}
      <AmountDisplay amount={transaction.amount} size="md" />
    </Pressable>
  );
}

/**
 * Compact transaction row for dashboard previews.
 */
export function TransactionRowCompact({
  transaction,
  onPress,
}: {
  transaction: TransactionWithRelations;
  onPress?: () => void;
}) {
  const category = transaction.category;

  return (
    <Pressable
      className="flex-row items-center py-3 active:opacity-70"
      onPress={onPress}
    >
      <View className="flex-1 mr-3">
        <Text
          className="text-sm font-medium text-foreground"
          numberOfLines={1}
        >
          {transaction.description}
        </Text>
        {category && (
          <Text
            className="text-xs mt-0.5"
            style={{ color: category.color }}
            numberOfLines={1}
          >
            {category.name}
          </Text>
        )}
      </View>
      <AmountDisplay amount={transaction.amount} size="sm" />
    </Pressable>
  );
}
