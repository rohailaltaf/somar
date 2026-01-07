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
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: isDown ? colors.successMuted : colors.destructiveMuted,
      }}
    >
      {isDown ? (
        <ArrowDownRight size={14} color={colors.success} />
      ) : (
        <ArrowUpRight size={14} color={colors.destructive} />
      )}
      <Text
        style={{
          fontFamily: "DMSans_600SemiBold",
          fontSize: 12,
          color: isDown ? colors.success : colors.destructive,
          marginLeft: 6,
        }}
      >
        {Math.abs(percentChange)}%
      </Text>
      {suffix && (
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 11,
            color: colors.mutedForeground,
            marginLeft: 6,
          }}
        >
          {suffix}
        </Text>
      )}
    </View>
  );
}
