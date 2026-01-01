import { View, Text, Pressable } from "react-native";
import type { TransactionWithRelations } from "@somar/shared";
import { AmountDisplay } from "./amount-display";

interface TransactionRowProps {
  transaction: TransactionWithRelations;
  onPress?: () => void;
}

export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const category = transaction.category;
  const isUnconfirmed = !transaction.isConfirmed;

  return (
    <Pressable
      className="flex-row items-center bg-card mx-4 mb-2 rounded-xl overflow-hidden active:opacity-90"
      onPress={onPress}
    >
      {/* Category accent bar */}
      <View
        className="w-1 self-stretch"
        style={{ backgroundColor: category?.color || "#64748b" }}
      />

      <View className="flex-1 flex-row items-center px-4 py-4">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center">
            <Text
              className="text-base font-medium text-foreground flex-shrink"
              numberOfLines={1}
            >
              {transaction.description}
            </Text>
            {isUnconfirmed && (
              <View className="ml-2 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </View>
          <Text
            className="text-sm text-muted-foreground mt-0.5"
            numberOfLines={1}
          >
            {category?.name || "Uncategorized"}
          </Text>
        </View>

        <AmountDisplay amount={transaction.amount} size="md" />
      </View>
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
