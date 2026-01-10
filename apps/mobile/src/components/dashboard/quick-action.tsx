import React from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import type { QuickActionProps } from "@somar/shared/components";
import { hexColors } from "@somar/shared/theme";
import {
  quickActionStyles,
  getQuickActionContainerClass,
  getQuickActionIconContainerClass,
  getQuickActionLabelClass,
} from "@somar/shared/styles";

/**
 * Quick action button for dashboard grids.
 * Uses shared styles from @somar/shared/styles.
 */
export function QuickAction({
  icon: Icon,
  label,
  sublabel,
  highlight = false,
  onPress,
}: QuickActionProps) {
  // Get icon color based on highlight state
  const iconColor = highlight ? hexColors.primary : hexColors.mutedForeground;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      className={`w-[48%] ${getQuickActionContainerClass(highlight)}`}
      style={highlight ? { borderColor: quickActionStyles.containerHighlightBorder } : undefined}
    >
      <View className={quickActionStyles.content}>
        <View className={`${getQuickActionIconContainerClass(highlight)} shrink-0`}>
          <Icon size={quickActionStyles.iconSize} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className={getQuickActionLabelClass(highlight)}>{label}</Text>
          <Text className={quickActionStyles.sublabel}>{sublabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}
