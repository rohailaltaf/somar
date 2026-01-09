import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { formatMonth, formatCurrency } from "@somar/shared";
import {
  heroCardStyles,
  heroCardHexColors,
  type HeroCardProps,
} from "@somar/shared/styles";
import { AnimatedCurrency } from "./animated-currency";
import { ProgressBar } from "../ui/progress-bar";
import { TrendBadge } from "../ui/trend-badge";

/**
 * Main hero card displaying total spending for the month.
 * Features gradient border, animated currency, and budget progress.
 * Animations match web's framer-motion implementation.
 */
export function HeroCard({
  currentMonth,
  totalSpending,
  spendingChange,
  budgetProgress,
  budgetRemaining,
  hasBudget,
}: HeroCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(700).delay(100)}
      style={{
        paddingHorizontal: heroCardStyles.outerPadding.horizontal,
        paddingTop: heroCardStyles.outerPadding.top,
        paddingBottom: heroCardStyles.outerPadding.bottom,
      }}
    >
      <LinearGradient
        colors={[
          heroCardHexColors.gradientStart,
          heroCardHexColors.gradientMid,
          heroCardHexColors.gradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: heroCardStyles.borderRadius.outer,
          padding: 1,
        }}
      >
        <View
          style={{
            backgroundColor: heroCardHexColors.surface,
            borderRadius: heroCardStyles.borderRadius.inner,
            padding: heroCardStyles.padding.mobile,
            minHeight: heroCardStyles.heights.mobile,
          }}
        >
          {/* Inner glow overlay */}
          <LinearGradient
            colors={[heroCardHexColors.glow + "26", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: heroCardStyles.borderRadius.inner,
            }}
          />

          {/* Header */}
          <View className={heroCardStyles.header.container}>
            <View>
              {/* Month label - fade in from left with delay */}
              <Animated.Text
                entering={FadeInLeft.duration(500).delay(200)}
                className={heroCardStyles.header.monthLabel}
              >
                {formatMonth(currentMonth)}
              </Animated.Text>
              {/* Subtitle - fade in from left with slightly more delay */}
              <Animated.Text
                entering={FadeInLeft.duration(500).delay(250)}
                className={heroCardStyles.header.subtitle}
              >
                Total Spending
              </Animated.Text>
            </View>

            {/* Trend Badge - fade in with scale effect */}
            {spendingChange !== null && (
              <Animated.View
                entering={FadeIn.duration(400).delay(400)}
              >
                <TrendBadge change={spendingChange} />
              </Animated.View>
            )}
          </View>

          {/* Main Amount */}
          <View className={heroCardStyles.amount.container}>
            <AnimatedCurrency value={totalSpending} />
          </View>

          {/* Budget Progress - fade in from bottom */}
          {hasBudget && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(500)}
              className={heroCardStyles.budgetProgress.container}
            >
              <View className={heroCardStyles.budgetProgress.labelRow}>
                <Text className={heroCardStyles.budgetProgress.label}>
                  Budget Progress
                </Text>
                <Text className={heroCardStyles.budgetProgress.remaining}>
                  {formatCurrency(budgetRemaining)} left
                </Text>
              </View>
              <ProgressBar percentage={budgetProgress * 100} />
            </Animated.View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
