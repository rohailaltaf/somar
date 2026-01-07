import React, { useEffect } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { oklchToHex } from "@somar/shared/utils";
import type { ThemeColors } from "../../lib/theme";

// Pre-computed colors for performance
export const BENTO_COLORS = {
  // Border gradient: oklch(0.5 0.18 260) via oklch(0.4 0.15 280)
  borderStart: oklchToHex("oklch(0.5 0.18 260)"),
  borderVia: oklchToHex("oklch(0.4 0.15 280)"),
  // Inner background gradient: oklch(0.22 0.08 260) to oklch(0.14 0.04 280)
  bgStart: oklchToHex("oklch(0.22 0.08 260)"),
  bgEnd: oklchToHex("oklch(0.14 0.04 280)"),
  // Base card: oklch(0.13 0.02 260)
  cardBg: oklchToHex("oklch(0.13 0.02 260)"),
};

interface BentoCardProps {
  children: React.ReactNode;
  colors: ThemeColors;
  isDark: boolean;
  /** Show highlight styling with pulsing glow */
  isHighlight?: boolean;
  /** Optional accent color for subtle gradient overlay */
  accentColor?: string;
}

/**
 * Bento-style card for dashboard grids.
 * Features gradient borders, inner glow, and optional pulsing animation.
 */
export function BentoCard({
  children,
  colors,
  isDark,
  isHighlight = false,
  accentColor,
}: BentoCardProps) {
  // Pulsing glow animation - subtle like web (3-8% opacity, 8s cycle)
  const glowOpacity = useSharedValue(0.03);

  useEffect(() => {
    if (isHighlight) {
      // Subtle pulse from 3% to 8% opacity over 8 seconds (matching web)
      glowOpacity.value = withTiming(0.08, { duration: 4000, easing: Easing.inOut(Easing.ease) }, () => {
        glowOpacity.value = withTiming(0.03, { duration: 4000, easing: Easing.inOut(Easing.ease) });
      });
      // Create pulsing loop
      const interval = setInterval(() => {
        glowOpacity.value = withTiming(0.08, { duration: 4000, easing: Easing.inOut(Easing.ease) }, () => {
          glowOpacity.value = withTiming(0.03, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        });
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isHighlight]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (isHighlight) {
    return (
      <View style={{ minHeight: 160 }}>
        {/* Background layer - oklch(0.22 0.08 260) to oklch(0.14 0.04 280) */}
        <LinearGradient
          colors={isDark ? [BENTO_COLORS.bgStart, BENTO_COLORS.bgEnd] : [colors.card, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
          }}
        />

        {/* Border gradient layer at 60% opacity - oklch(0.5 0.18 260) via oklch(0.4 0.15 280) */}
        <LinearGradient
          colors={isDark
            ? [BENTO_COLORS.borderStart + "99", BENTO_COLORS.borderVia + "99", BENTO_COLORS.borderStart + "99"]
            : [colors.primary + "99", "#8b5cf699", colors.primary + "99"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
          }}
        />

        {/* Pulsing glow layer - very subtle like web (3-8% opacity) */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 16,
              backgroundColor: BENTO_COLORS.borderStart,
            },
            glowStyle,
          ]}
        />

        {/* Inner content area with background - inset by 1px */}
        <LinearGradient
          colors={isDark ? [BENTO_COLORS.bgStart, BENTO_COLORS.bgEnd] : [colors.card, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            margin: 1,
            borderRadius: 15,
            padding: 16,
            shadowColor: BENTO_COLORS.borderStart,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isDark ? 0.2 : 0.1,
            shadowRadius: 30,
            elevation: 8,
          }}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? BENTO_COLORS.cardBg : colors.card,
        borderRadius: 16,
        padding: 16,
        minHeight: 160,
      }}
    >
      {accentColor && (
        <LinearGradient
          colors={[accentColor + "0D", "transparent"]} // 5% opacity gradient overlay
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
          }}
        />
      )}
      {children}
    </View>
  );
}
