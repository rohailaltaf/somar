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
} from "@somar/shared/styles";

/**
 * Trend indicator badge showing percentage change.
 * For spending: up is bad (red), down is good (green).
 * Uses shared styles from @somar/shared/styles.
 */
export function TrendBadge({ change }: TrendBadgeProps) {
  if (change === null) return null;

  const direction = getTrendVariant(change);
  const textClass = getTrendBadgeTextClass(direction);

  // Get icon color based on direction
  const iconColor =
    direction === "up"
      ? hexColors.destructive
      : direction === "down"
      ? hexColors.success
      : hexColors.mutedForeground;

  return (
    <View className={getTrendBadgeContainerClass(direction)}>
      {direction === "up" ? (
        <ArrowUpRight size={trendBadgeStyles.iconSize} color={iconColor} />
      ) : direction === "down" ? (
        <ArrowDownRight size={trendBadgeStyles.iconSize} color={iconColor} />
      ) : null}
      <Text className={textClass}>{Math.abs(change)}%</Text>
      <Text className={`${trendBadgeStyles.suffix} ${trendBadgeStyles.textColor[direction]}`}>
        vs last mo
      </Text>
    </View>
  );
}
