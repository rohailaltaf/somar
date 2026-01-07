import React from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { oklchToHex } from "@somar/shared/utils";
import type { ThemeColors } from "../../lib/theme";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  colors: ThemeColors;
  isDark: boolean;
  /** Highlight style for emphasized actions */
  isHighlight?: boolean;
  onPress: () => void;
}

/**
 * Quick action button for dashboard grids.
 * Horizontal layout with icon, label, and sublabel.
 */
export function QuickAction({
  icon: Icon,
  label,
  sublabel,
  colors,
  isDark,
  isHighlight = false,
  onPress,
}: QuickActionProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="w-[48%] rounded-2xl p-4 flex-row items-center border"
      style={{
        backgroundColor: isHighlight
          ? isDark
            ? "rgba(58, 45, 112, 0.3)"
            : colors.primaryMuted
          : colors.card,
        borderColor: isHighlight
          ? isDark
            ? "rgba(99, 102, 241, 0.3)"
            : colors.primary + "40"
          : isDark
            ? "rgba(46, 50, 66, 0.5)"
            : colors.border,
      }}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
        style={{
          backgroundColor: isHighlight
            ? isDark
              ? "rgba(99, 102, 241, 0.3)"
              : colors.primary + "30"
            : isDark
              ? oklchToHex("oklch(0.18 0.02 260)")
              : colors.muted,
        }}
      >
        <Icon
          size={16}
          color={
            isHighlight
              ? isDark
                ? oklchToHex("oklch(0.75 0.15 260)")
                : colors.primary
              : colors.mutedForeground
          }
        />
      </View>
      <View>
        <Text className="font-medium text-sm text-foreground">
          {label}
        </Text>
        <Text className="font-sans text-[11px] text-muted-foreground mt-[1px]">
          {sublabel}
        </Text>
      </View>
    </Pressable>
  );
}
