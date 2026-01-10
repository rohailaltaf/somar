import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { StatCardProps } from "@somar/shared/components";
import {
  bentoCardStyles,
  bentoCardHexColors,
  getBentoValueClass,
  getBentoIconContainerClass,
} from "@somar/shared/styles";
import { hexColors } from "@somar/shared/theme";

/**
 * Stat card for dashboard bento grid.
 * Uses shared styles from @somar/shared/styles.
 * Mobile implementation matching web's StatCard pattern.
 */
export function StatCard({
  icon: Icon,
  iconColorClass,
  value,
  label,
  highlight = false,
  onPress,
}: StatCardProps) {
  const { container, animation } = bentoCardStyles;

  // Pulsing glow animation - subtle like web
  const glowOpacity = useSharedValue(animation.glowOpacityMin);

  useEffect(() => {
    if (highlight) {
      const halfDuration = animation.glowDuration / 2;
      // Subtle pulse from min to max opacity
      glowOpacity.value = withTiming(
        animation.glowOpacityMax,
        { duration: halfDuration, easing: Easing.inOut(Easing.ease) },
        () => {
          glowOpacity.value = withTiming(animation.glowOpacityMin, {
            duration: halfDuration,
            easing: Easing.inOut(Easing.ease),
          });
        }
      );
      // Create pulsing loop
      const interval = setInterval(() => {
        glowOpacity.value = withTiming(
          animation.glowOpacityMax,
          { duration: halfDuration, easing: Easing.inOut(Easing.ease) },
          () => {
            glowOpacity.value = withTiming(animation.glowOpacityMin, {
              duration: halfDuration,
              easing: Easing.inOut(Easing.ease),
            });
          }
        );
      }, animation.glowDuration);
      return () => clearInterval(interval);
    }
  }, [highlight, glowOpacity, animation]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  /**
   * Map iconColorClass to hex color for native components.
   * iconColorClass is like "text-primary" or "text-muted-foreground".
   */
  function getIconColor(): string {
    if (iconColorClass.includes("primary")) return hexColors.primary;
    if (iconColorClass.includes("gold")) return hexColors.gold;
    if (iconColorClass.includes("muted")) return hexColors.mutedForeground;
    return hexColors.foreground;
  }

  const content = (
    <View style={{ minHeight: container.minHeight, flex: 1 }}>
      {highlight ? (
        <>
          {/* Background layer */}
          <LinearGradient
            colors={[bentoCardHexColors.bgStart, bentoCardHexColors.bgEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: container.borderRadius,
            }}
          />

          {/* Border gradient layer at 60% opacity */}
          <LinearGradient
            colors={[
              bentoCardHexColors.borderStart + "99",
              bentoCardHexColors.borderVia + "99",
              bentoCardHexColors.borderStart + "99",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: container.borderRadius,
            }}
          />

          {/* Pulsing glow layer */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: container.borderRadius,
                backgroundColor: bentoCardHexColors.borderStart,
              },
              glowStyle,
            ]}
          />

          {/* Inner content area with background - inset by 1px */}
          <LinearGradient
            colors={[bentoCardHexColors.bgStart, bentoCardHexColors.bgEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              margin: 1,
              borderRadius: container.borderRadius - 1,
              padding: container.padding,
              shadowColor: bentoCardHexColors.borderStart,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 30,
              elevation: 8,
            }}
          >
            {/* Header with icon and chevron */}
            <View className={`flex ${bentoCardStyles.header}`}>
              <View className={getBentoIconContainerClass(highlight)}>
                <Icon size={bentoCardStyles.iconSize} color={getIconColor()} />
              </View>
              <ChevronRight size={bentoCardStyles.chevronSize} color={hexColors.foregroundDim} />
            </View>

            {/* Value section */}
            <View className="mt-auto pt-5">
              <Text
                className={`${bentoCardStyles.value} ${getBentoValueClass(highlight, value)}`}
              >
                {value}
              </Text>
              <Text className={bentoCardStyles.label}>{label}</Text>
            </View>
          </LinearGradient>
        </>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: bentoCardHexColors.cardBg,
            borderRadius: container.borderRadius,
            padding: container.padding,
          }}
        >
          {/* Header with icon and chevron */}
          <View className={`flex ${bentoCardStyles.header}`}>
            <View className={getBentoIconContainerClass(highlight)}>
              <Icon size={bentoCardStyles.iconSize} color={getIconColor()} />
            </View>
            <ChevronRight size={bentoCardStyles.chevronSize} color={hexColors.foregroundDim} />
          </View>

          {/* Value section */}
          <View className="mt-auto pt-5">
            <Text
              className={`${bentoCardStyles.value} ${getBentoValueClass(highlight, value)}`}
            >
              {value}
            </Text>
            <Text className={bentoCardStyles.label}>{label}</Text>
          </View>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className="flex-1"
      >
        {content}
      </Pressable>
    );
  }

  return <View className="flex-1">{content}</View>;
}
