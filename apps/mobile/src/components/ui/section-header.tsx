import { View, Text } from "react-native";
import { useMemo } from "react";

interface DateSectionHeaderProps {
  date: string; // YYYY-MM-DD format
  /** Optional total for this day */
  dayTotal?: number;
}

/**
 * Format date for section header.
 * Shows relative dates for today/yesterday, otherwise full date.
 */
function formatSectionDate(dateStr: string): { primary: string; secondary?: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const transactionDate = new Date(year, month - 1, day);
  transactionDate.setHours(0, 0, 0, 0);

  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  if (transactionDate.getTime() === today.getTime()) {
    return { primary: "Today", secondary: monthDay };
  }
  if (transactionDate.getTime() === yesterday.getTime()) {
    return { primary: "Yesterday", secondary: monthDay };
  }

  // Within the last week, show day name
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  if (transactionDate > oneWeekAgo) {
    return { primary: dayOfWeek, secondary: monthDay };
  }

  // Older dates
  const fullDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: year !== today.getFullYear() ? "numeric" : undefined,
  });
  return { primary: fullDate };
}

export function DateSectionHeader({ date, dayTotal }: DateSectionHeaderProps) {
  const { primary, secondary } = useMemo(() => formatSectionDate(date), [date]);

  const formattedTotal = useMemo(() => {
    if (dayTotal === undefined) return null;
    const abs = Math.abs(dayTotal);
    return dayTotal < 0
      ? `-$${abs.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      : `+$${abs.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }, [dayTotal]);

  return (
    <View className="px-5 py-3 bg-surface border-b border-border-subtle">
      <View className="flex-row items-baseline justify-between">
        <View className="flex-row items-baseline">
          <Text className="text-sm font-semibold text-foreground">
            {primary}
          </Text>
          {secondary && (
            <Text className="text-sm text-muted-foreground ml-2">
              {secondary}
            </Text>
          )}
        </View>
        {formattedTotal && (
          <Text
            className={`text-sm font-medium ${
              dayTotal! < 0 ? "text-muted-foreground" : "text-success"
            }`}
          >
            {formattedTotal}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Generic section header for lists.
 */
export function SectionHeader({
  title,
  action,
  onActionPress,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </Text>
      {action && (
        <Text
          className="text-sm font-medium text-primary"
          onPress={onActionPress}
        >
          {action}
        </Text>
      )}
    </View>
  );
}
