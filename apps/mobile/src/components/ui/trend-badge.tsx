import React from "react";
import { View, Text } from "react-native";
import { ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import type { ThemeColors } from "../../lib/theme";

interface TrendBadgeProps {
  /** Percentage change (negative = down, positive = up) */
  percentChange: number;
  colors: ThemeColors;
  /** Optional suffix text */
  suffix?: string;
}

/**
 * Badge showing percentage change with directional arrow.
 * Green for decrease (good for spending), red for increase.
 */
export function TrendBadge({
  percentChange,
  colors,
  suffix = "vs last mo",
}: TrendBadgeProps) {
  const isDown = percentChange <= 0;

  return (
    <View
      className={`flex-row items-center self-start px-3 py-1.5 rounded-full ${
        isDown ? "bg-success/15" : "bg-destructive/15"
      }`}
    >
      {isDown ? (
        <ArrowDownRight size={14} color={colors.success} />
      ) : (
        <ArrowUpRight size={14} color={colors.destructive} />
      )}
      <Text
        className={`font-semibold text-xs ml-1.5 ${
          isDown ? "text-success-muted" : "text-destructive-muted"
        }`}
      >
        {Math.abs(percentChange)}%
      </Text>
      {suffix && (
        <Text
          className={`text-[11px] ml-1.5 opacity-70 ${
            isDown ? "text-success-muted" : "text-destructive-muted"
          }`}
        >
          {suffix}
        </Text>
      )}
    </View>
  );
}
