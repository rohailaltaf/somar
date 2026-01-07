import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { formatMonth, formatCurrency } from "@somar/shared";
import { oklchToHex } from "@somar/shared/utils";
import type { ThemeColors } from "../../lib/theme";
import { AnimatedCurrency } from "../ui/animated-currency";
import { AnimatedProgressBar } from "../ui/animated-progress-bar";
import { TrendBadge } from "../ui/trend-badge";

interface HeroCardProps {
  currentMonth: string;
  spendingValue: number;
  previousSpending: number;
  percentChange: number | null;
  totalBudget: number;
  budgetProgress: number;
  budgetRemaining: number;
  colors: ThemeColors;
  isDark: boolean;
}

/**
 * Hero card showing total spending for the current month.
 * Features gradient border, animated currency, and budget progress.
 */
export function HeroCard({
  currentMonth,
  spendingValue,
  previousSpending,
  percentChange,
  totalBudget,
  budgetProgress,
  budgetRemaining,
  colors,
  isDark,
}: HeroCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(600).delay(100)}
      style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
    >
      <LinearGradient
        colors={isDark
          ? [
              oklchToHex("oklch(0.35 0.15 260)"),
              oklchToHex("oklch(0.25 0.1 280)"),
              oklchToHex("oklch(0.2 0.08 300)"),
            ]
          : [colors.primary + "40", colors.primary + "20", colors.primary + "10"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 1,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? oklchToHex("oklch(0.11 0.02 260)") : colors.card,
            borderRadius: 23,
            padding: 24,
            minHeight: 280,
          }}
        >
          {/* Inner glow overlay */}
          {isDark && (
            <LinearGradient
              colors={[oklchToHex("oklch(0.4 0.15 260)") + "1A", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 23,
              }}
            />
          )}

          {/* Header row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <Text className="font-medium text-[11px] text-muted-foreground uppercase tracking-[1.65px] mb-1">
                {formatMonth(currentMonth)}
              </Text>
              <Text className="font-sans text-xs text-muted-foreground">
                Total Spending
              </Text>
            </View>

            {/* Trend Badge */}
            {previousSpending !== 0 && percentChange !== null && (
              <Animated.View entering={FadeInRight.duration(400).delay(400)}>
                <TrendBadge percentChange={percentChange} colors={colors} />
              </Animated.View>
            )}
          </View>

          {/* Large Amount Display - centered */}
          <View style={{ flex: 1, justifyContent: "center", paddingVertical: 24 }}>
            <AnimatedCurrency value={spendingValue} colors={colors} />
          </View>

          {/* Budget Progress - at bottom */}
          {totalBudget > 0 && (
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text className="font-medium text-[13px] text-muted-foreground">
                  Budget Progress
                </Text>
                <Text className="font-semibold text-[13px] text-foreground">
                  {formatCurrency(budgetRemaining)} left
                </Text>
              </View>
              <AnimatedProgressBar progress={budgetProgress} />
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
