import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AlertTriangle, X } from "lucide-react-native";
import { demoBannerStyles, type DemoBannerProps } from "@somar/shared/styles";

const styles = demoBannerStyles;
const colors = styles.colors.hex;

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className={styles.container}
      style={{
        backgroundColor: colors.background,
        minHeight: styles.heights.banner,
      }}
    >
      <View className={styles.content}>
        <View className={styles.iconWrapper}>
          <AlertTriangle
            size={styles.dimensions.iconSize}
            color={colors.icon}
          />
        </View>
        <View>
          <Text className={styles.text} style={{ color: colors.text }}>
            Demo Mode
          </Text>
          <Text className={styles.subtext} style={{ color: colors.textSecondary }}>
            Using sample data
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onExit}
        className={styles.exitButton}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.buttonHover : "transparent",
        })}
      >
        <X size={styles.dimensions.exitIconSize} color={colors.text} />
        <Text className={styles.exitButtonText} style={{ color: colors.text }}>
          Exit Demo
        </Text>
      </Pressable>
    </Animated.View>
  );
}
