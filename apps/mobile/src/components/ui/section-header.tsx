import { View, Text, Pressable } from "react-native";
import { useMemo } from "react";
import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";
import type { ThemeColors } from "../../lib/theme";

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

  // All other dates: weekday + month/day (with year if different)
  const isDifferentYear = year !== today.getFullYear();
  const secondary = isDifferentYear
    ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : monthDay;

  return { primary: dayOfWeek, secondary };
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

interface DashboardSectionHeaderProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  colors: ThemeColors;
}

/**
 * Enhanced section header for dashboard with subtitle and action.
 * Uses inline styles for precise theme control.
 */
export function DashboardSectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  colors,
}: DashboardSectionHeaderProps) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
      <View>
        <Text
          style={{
            fontFamily: "DMSans_600SemiBold",
            fontSize: 18,
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 13,
            color: colors.mutedForeground,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAction();
        }}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <Text
          style={{
            fontFamily: "DMSans_500Medium",
            fontSize: 13,
            color: colors.mutedForeground,
            marginRight: 4,
          }}
        >
          {actionLabel}
        </Text>
        <ChevronRight size={14} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}
