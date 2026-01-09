import { View, Text } from "react-native";
import { useDateSection, useAmountDisplay } from "@somar/shared/ui-logic";

interface DateSectionHeaderProps {
  date: string; // YYYY-MM-DD format
  /** Optional total for this day */
  dayTotal?: number;
}

/**
 * Date section header for grouping transactions by date.
 * DashboardSectionHeader has been moved to @/src/components/dashboard/section-header.tsx
 */
export function DateSectionHeader({ date, dayTotal }: DateSectionHeaderProps) {
  // Use shared hook for date formatting
  const { primary, secondary } = useDateSection(date);

  // Use shared hook for amount display (if dayTotal provided)
  const amountDisplay = dayTotal !== undefined
    ? useAmountDisplay(dayTotal, { showSign: true })
    : null;

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
        {amountDisplay && (
          <Text
            className={`text-sm font-medium ${amountDisplay.colorClass}`}
          >
            {amountDisplay.display}
          </Text>
        )}
      </View>
    </View>
  );
}
