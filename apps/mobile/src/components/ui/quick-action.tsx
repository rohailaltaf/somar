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
      style={{
        width: "48%", // 2 per row with gap
        backgroundColor: isHighlight
          ? isDark
            ? "rgba(58, 45, 112, 0.3)" // oklch(0.2 0.06 260)
            : colors.primaryMuted
          : colors.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
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
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: isHighlight
            ? isDark
              ? "rgba(99, 102, 241, 0.3)"
              : colors.primary + "30"
            : isDark
              ? oklchToHex("oklch(0.18 0.02 260)")
              : colors.muted,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
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
        <Text
          style={{
            fontFamily: "DMSans_500Medium",
            fontSize: 14,
            color: colors.foreground,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 11,
            color: colors.mutedForeground,
            marginTop: 1,
          }}
        >
          {sublabel}
        </Text>
      </View>
    </Pressable>
  );
}
