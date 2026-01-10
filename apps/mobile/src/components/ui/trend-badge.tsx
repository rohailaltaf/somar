import React from "react";
import { View, Text } from "react-native";
import { ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import { hexColors } from "@somar/shared/theme";
import {
  trendBadgeStyles,
  getTrendVariant,
  getTrendBadgeContainerClass,
  getTrendBadgeTextClass,
  type TrendBadgeProps,
  type TrendDirection,
} from "@somar/shared/styles";

function getIconColor(direction: TrendDirection): string {
  switch (direction) {
    case "up":
      return hexColors.destructive;
    case "down":
      return hexColors.success;
    case "neutral":
      return hexColors.mutedForeground;
  }
}

function TrendIcon({ direction }: { direction: TrendDirection }): React.ReactNode {
  const color = getIconColor(direction);
  const size = trendBadgeStyles.iconSize;

  switch (direction) {
    case "up":
      return <ArrowUpRight size={size} color={color} />;
    case "down":
      return <ArrowDownRight size={size} color={color} />;
    case "neutral":
      return null;
  }
}

/**
 * Trend indicator badge showing percentage change.
 * For spending: up is bad (red), down is good (green).
 * Uses shared styles from @somar/shared/styles.
 */
export function TrendBadge({ change }: TrendBadgeProps): React.ReactNode {
  if (change === null) return null;

  const direction = getTrendVariant(change);
  const textClass = getTrendBadgeTextClass(direction);

  return (
    <View className={getTrendBadgeContainerClass(direction)}>
      <TrendIcon direction={direction} />
      <Text className={textClass}>{Math.abs(change)}%</Text>
      <Text className={`${trendBadgeStyles.suffix} ${trendBadgeStyles.textColor[direction]}`}>
        vs last mo
      </Text>
    </View>
  );
}
