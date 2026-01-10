import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";
import type { DashboardSectionHeaderProps } from "@somar/shared/components";
import { hexColors } from "@somar/shared/theme";
import { sectionHeaderStyles } from "@somar/shared/styles";

/**
 * Dashboard section header with title, subtitle, and action button.
 * Uses shared styles from @somar/shared/styles.
 */
export function DashboardSectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: DashboardSectionHeaderProps) {
  const { dashboard } = sectionHeaderStyles;

  return (
    <View className={dashboard.container}>
      <View className={dashboard.titleContainer}>
        <Text className={dashboard.title}>{title}</Text>
        <Text className={dashboard.subtitle}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAction();
        }}
        className={dashboard.actionContainer}
      >
        <Text className={dashboard.actionLabel}>{actionLabel}</Text>
        <ChevronRight size={dashboard.actionChevronSize} color={hexColors.mutedForeground} />
      </Pressable>
    </View>
  );
}
