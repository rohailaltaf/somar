import React, { useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  Zap,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  TrendingUp,
  CreditCard,
  type LucideIcon,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Rect, Line } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  useTotalSpending,
  useSpendingByCategory,
  useCategoriesWithBudgets,
  useRecentTransactions,
  useUnconfirmedCount,
  useDatabaseAdapter,
  useAccounts,
} from "@somar/shared/hooks";
import {
  getCurrentMonth,
  getPreviousMonth,
  formatMonth,
  formatCurrency,
  getPercentageChange,
} from "@somar/shared";
import { themeColors, type ThemeColors } from "../../src/lib/theme";
import { DashboardCardSkeleton } from "../../src/components/ui";
import { oklchToHex } from "../../src/lib/color";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];
  const { isReady: dbReady } = useDatabaseAdapter();
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const previousMonth = useMemo(() => getPreviousMonth(), []);

  // Data hooks
  const {
    data: currentSpending = 0,
    isLoading: loadingCurrent,
    refetch: refetchCurrent,
  } = useTotalSpending(currentMonth);
  const { data: previousSpending = 0 } = useTotalSpending(previousMonth);
  const { data: spendingByCategory = [], refetch: refetchByCategory } =
    useSpendingByCategory(currentMonth, { limit: 5 });
  const { data: categoriesWithBudgets = [] } = useCategoriesWithBudgets(currentMonth);
  const { data: recentTransactions = [], refetch: refetchTransactions } =
    useRecentTransactions(5);
  const { data: unconfirmedCount = 0 } = useUnconfirmedCount();
  const { data: accounts = [] } = useAccounts();

  // Calculate metrics
  const percentChange = useMemo(
    () => getPercentageChange(Math.abs(currentSpending), Math.abs(previousSpending)),
    [currentSpending, previousSpending]
  );

  const totalBudget = useMemo(
    () =>
      categoriesWithBudgets.reduce((sum, cat) => sum + (cat.currentBudget?.amount || 0), 0),
    [categoriesWithBudgets]
  );

  const budgetProgress = totalBudget > 0 ? Math.abs(currentSpending) / totalBudget : 0;
  const budgetRemaining = Math.max(0, totalBudget - Math.abs(currentSpending));

  // Get top spending categories (DB already limits to 5 via hook options)
  const categoryProgress = useMemo(() => {
    return spendingByCategory.map((cat) => {
      const budget = categoriesWithBudgets.find((b) => b.id === cat.id);
      const spent = cat.spent;
      const budgetAmount = budget?.currentBudget?.amount || 0;
      return {
        id: cat.id,
        name: cat.name,
        color: oklchToHex(cat.color),
        spent,
        budget: budgetAmount,
        progress: budgetAmount > 0 ? spent / budgetAmount : 0,
      };
    });
  }, [spendingByCategory, categoriesWithBudgets]);

  const totalCategorySpending = categoryProgress.reduce((sum, cat) => sum + cat.spent, 0);

  const handleRefresh = async () => {
    await Promise.all([refetchCurrent(), refetchByCategory(), refetchTransactions()]);
  };

  const isLoading = !dbReady || loadingCurrent;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
        <DashboardSkeleton colors={colors} />
      </View>
    );
  }

  const hasData = recentTransactions.length > 0;
  const spendingValue = Math.abs(currentSpending);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Atmospheric Background - Deep Space Effect (matched to web) */}
      {isDark && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Primary nebula - oklch(0.25 0.15 280) at 12% */}
              <RadialGradient id="nebulaPrimary" cx="-10%" cy="-20%" rx="70%" ry="70%">
                <Stop offset="0%" stopColor="#1d0166" stopOpacity="0.12" />
                <Stop offset="50%" stopColor="#1d0166" stopOpacity="0.06" />
                <Stop offset="100%" stopColor="#1d0166" stopOpacity="0" />
              </RadialGradient>
              {/* Secondary glow - oklch(0.35 0.12 200) at 8% */}
              <RadialGradient id="nebulaSecondary" cx="115%" cy="30%" rx="50%" ry="60%">
                <Stop offset="0%" stopColor="#004a53" stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#004a53" stopOpacity="0" />
              </RadialGradient>
              {/* Accent highlight - oklch(0.45 0.18 260) at 6% */}
              <RadialGradient id="nebulaAccent" cx="20%" cy="110%" rx="40%" ry="40%">
                <Stop offset="0%" stopColor="#044cb6" stopOpacity="0.06" />
                <Stop offset="100%" stopColor="#044cb6" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaPrimary)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaSecondary)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaAccent)" />
          </Svg>
          {/* Subtle grid overlay - 60px spacing to match web */}
          <View style={[StyleSheet.absoluteFill, { opacity: 0.02 }]}>
            <Svg width="100%" height="100%">
              {Array.from({ length: 15 }).map((_, i) => (
                <Line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * 60}
                  x2="100%"
                  y2={i * 60}
                  stroke="#5d646f"
                  strokeWidth="0.5"
                />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <Line
                  key={`v-${i}`}
                  x1={i * 60}
                  y1="0"
                  x2={i * 60}
                  y2="100%"
                  stroke="#5d646f"
                  strokeWidth="0.5"
                />
              ))}
            </Svg>
          </View>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Section - Gradient bordered card like web */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={{ padding: 20, paddingTop: 16 }}>
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
                  <Text
                    style={{
                      fontFamily: "DMSans_500Medium",
                      fontSize: 11,
                      color: colors.mutedForeground,
                      letterSpacing: 1.65,  // 0.15em at 11px
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {formatMonth(currentMonth)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "DMSans_400Regular",
                      fontSize: 12,
                      color: colors.mutedForeground,
                    }}
                  >
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
                    <Text
                      style={{
                        fontFamily: "DMSans_500Medium",
                        fontSize: 13,
                        color: colors.mutedForeground,
                      }}
                    >
                      Budget Progress
                    </Text>
                    <Text
                      style={{
                        fontFamily: "DMSans_600SemiBold",
                        fontSize: 13,
                        color: colors.foreground,
                      }}
                    >
                      {formatCurrency(budgetRemaining)} left
                    </Text>
                  </View>
                  <AnimatedBudgetBar progress={budgetProgress} colors={colors} />
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bento Grid - Cards Row */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={{
            flexDirection: "row",
            paddingHorizontal: 20,
            gap: 12,
            marginTop: 8,
          }}
        >
          {/* Uncategorized Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/transactions");
            }}
            style={{ flex: 1 }}
          >
            <BentoCard
              colors={colors}
              isDark={isDark}
              isHighlight={unconfirmedCount > 0}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: unconfirmedCount > 0
                      ? colors.primary + "33"
                      : colors.muted,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Zap
                    size={20}
                    color={unconfirmedCount > 0 ? colors.primary : colors.mutedForeground}
                  />
                </View>
                <ChevronRight
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              <View style={{ marginTop: "auto", paddingTop: 20 }}>
                <Text
                  style={{
                    fontFamily: "DMSans_700Bold",
                    fontSize: 28,
                    color: unconfirmedCount > 0 ? colors.foreground : colors.mutedForeground,
                  }}
                >
                  {unconfirmedCount}
                </Text>
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 12,
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                >
                  {unconfirmedCount === 1 ? 'Transaction' : 'Transactions'} to categorize
                </Text>
              </View>
            </BentoCard>
          </Pressable>

          {/* Accounts Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to accounts when available
            }}
            style={{ flex: 1 }}
          >
            <BentoCard colors={colors} isDark={isDark} accentColor={colors.premiumGold}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colors.premiumGold + "1A",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wallet size={20} color={colors.premiumGold} />
                </View>
                <ChevronRight
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              <View style={{ marginTop: "auto", paddingTop: 20 }}>
                <Text
                  style={{
                    fontFamily: "DMSans_700Bold",
                    fontSize: 28,
                    color: colors.foreground,
                  }}
                >
                  {accounts.length}
                </Text>
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 12,
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                >
                  Connected {accounts.length === 1 ? "Account" : "Accounts"}
                </Text>
              </View>
            </BentoCard>
          </Pressable>
        </Animated.View>

        {/* Category Breakdown */}
        {categoryProgress.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={{ marginHorizontal: 20, marginTop: 24 }}
          >
            <SectionHeader
              title="Spending Breakdown"
              subtitle="Where your money went"
              actionLabel="Manage"
              onAction={() => router.push("/categories" as never)}
              colors={colors}
            />

            <View
              style={{
                backgroundColor: isDark ? oklchToHex("oklch(0.12 0.02 260)") : colors.card,
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: isDark ? "rgba(46, 50, 66, 0.5)" : colors.border,
                marginTop: 16,
              }}
            >
              {categoryProgress.map((cat, index) => (
                <CategoryRow
                  key={cat.id}
                  name={cat.name}
                  spent={cat.spent}
                  budget={cat.budget}
                  color={cat.color}
                  percentage={totalCategorySpending > 0 ? (cat.spent / totalCategorySpending) * 100 : 0}
                  colors={colors}
                  isLast={index === categoryProgress.length - 1}
                  index={index}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(500)}
            style={{ marginHorizontal: 20, marginTop: 24 }}
          >
            <SectionHeader
              title="Recent Activity"
              subtitle="Latest transactions"
              actionLabel="View all"
              onAction={() => router.push("/(tabs)/transactions")}
              colors={colors}
            />

            <View
              style={{
                backgroundColor: isDark ? oklchToHex("oklch(0.12 0.02 260)") : colors.card,
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: isDark ? "rgba(46, 50, 66, 0.5)" : colors.border,
                marginTop: 16,
              }}
            >
              {recentTransactions.map((tx, index) => (
                <TransactionRow
                  key={tx.id}
                  description={tx.description}
                  amount={tx.amount}
                  date={tx.date}
                  categoryName={tx.category?.name}
                  categoryColor={tx.category?.color ? oklchToHex(tx.category.color) : undefined}
                  isConfirmed={tx.isConfirmed}
                  colors={colors}
                  isLast={index === recentTransactions.length - 1}
                  index={index}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Empty State */}
        {!hasData && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(300)}
            style={{ marginHorizontal: 20, marginTop: 32 }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 40,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: colors.muted,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Wallet size={28} color={colors.mutedForeground} />
              </View>
              <Text
                style={{
                  fontFamily: "DMSans_600SemiBold",
                  fontSize: 17,
                  color: colors.foreground,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                No transactions yet
              </Text>
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 14,
                  color: colors.mutedForeground,
                  textAlign: "center",
                  lineHeight: 20,
                  maxWidth: 240,
                }}
              >
                Connect your bank or import transactions on the web app to see your spending here.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions - 2x2 grid like web */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(600)}
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: 20,
            gap: 12,
            marginTop: 24,
          }}
        >
          <QuickAction
            icon={Upload}
            label="Upload"
            sublabel="Import CSV"
            colors={colors}
            isDark={isDark}
            onPress={() => {}}
          />
          <QuickAction
            icon={Zap}
            label="Categorize"
            sublabel="Quick tagger"
            colors={colors}
            isDark={isDark}
            isHighlight={unconfirmedCount > 0}
            onPress={() => router.push("/(tabs)/transactions")}
          />
          <QuickAction
            icon={TrendingUp}
            label="Reports"
            sublabel="Analytics"
            colors={colors}
            isDark={isDark}
            onPress={() => {}}
          />
          <QuickAction
            icon={CreditCard}
            label="Accounts"
            sublabel="Manage"
            colors={colors}
            isDark={isDark}
            onPress={() => {}}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Animated Currency with Reanimated
function AnimatedCurrency({ value, colors }: { value: number; colors: ThemeColors }) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  // Using regular state for display since we need to format the number
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentVal = animatedValue.value;
      setDisplayValue(Math.round(currentVal));
    }, 16);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayValue(value);
    }, 1300);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [value, animatedValue]);

  const formatted = formatCurrency(displayValue);
  const [dollars, cents] = formatted.split(".");

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text
        style={{
          fontFamily: "InstrumentSerif_400Regular",
          fontSize: 64,
          color: colors.foreground,
          letterSpacing: -2,
          lineHeight: 68,
        }}
      >
        {dollars}
      </Text>
      {cents && (
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular",
            fontSize: 32,
            color: colors.mutedForeground,
            marginLeft: 4,
          }}
        >
          .{cents}
        </Text>
      )}
    </View>
  );
}

// Trend Badge Component
function TrendBadge({ percentChange, colors }: { percentChange: number; colors: ThemeColors }) {
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
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 11,
          color: colors.mutedForeground,
          marginLeft: 6,
        }}
      >
        vs last mo
      </Text>
    </View>
  );
}

// Bento Card Component - colors computed using oklchToHex to match web exactly
const BENTO_COLORS = {
  // Border gradient: oklch(0.5 0.18 260) via oklch(0.4 0.15 280)
  borderStart: oklchToHex("oklch(0.5 0.18 260)"),
  borderVia: oklchToHex("oklch(0.4 0.15 280)"),
  // Inner background gradient: oklch(0.22 0.08 260) to oklch(0.14 0.04 280)
  bgStart: oklchToHex("oklch(0.22 0.08 260)"),
  bgEnd: oklchToHex("oklch(0.14 0.04 280)"),
  // Base card: oklch(0.13 0.02 260)
  cardBg: oklchToHex("oklch(0.13 0.02 260)"),
};

function BentoCard({
  children,
  colors,
  isDark,
  isHighlight = false,
  accentColor,
}: {
  children: React.ReactNode;
  colors: ThemeColors;
  isDark: boolean;
  isHighlight?: boolean;
  accentColor?: string;
}) {
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
            padding:16,
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
        // No border on inactive state (matching web)
      }}
    >
      {accentColor && (
        <LinearGradient
          colors={[accentColor + "0D", "transparent"]}  // 5% opacity gradient overlay
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

// Animated Budget Bar with glow effect (matched to web)
function AnimatedBudgetBar({ progress, colors }: { progress: number; colors: ThemeColors }) {
  const animatedWidth = useSharedValue(0);
  const clampedProgress = Math.min(progress, 1);

  useEffect(() => {
    animatedWidth.value = withDelay(
      300,
      withTiming(clampedProgress * 100, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [clampedProgress]);

  const getColor = () => {
    if (progress >= 1) return oklchToHex("oklch(0.6 0.2 25)");  // red
    if (progress >= 0.8) return oklchToHex("oklch(0.75 0.18 75)"); // amber
    return oklchToHex("oklch(0.55 0.18 260)");  // primary
  };

  const barColor = getColor();

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View
      style={{
        height: 8,
        backgroundColor: oklchToHex("oklch(0.2 0.02 260)"),
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* Glow layer */}
      <Animated.View
        style={[
          {
            position: "absolute",
            height: "100%",
            backgroundColor: barColor,
            borderRadius: 4,
            opacity: 0.5,
            shadowColor: barColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
          },
          animatedStyle,
        ]}
      />
      {/* Main bar */}
      <Animated.View
        style={[
          {
            height: "100%",
            backgroundColor: barColor,
            borderRadius: 4,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

// Section Header
function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  colors,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  colors: ThemeColors;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
      <View>
        <Text
          style={{
            fontFamily: "DMSans_600SemiBold",
            fontSize: 18,
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 13,
            color: colors.mutedForeground,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAction();
        }}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <Text
          style={{
            fontFamily: "DMSans_500Medium",
            fontSize: 13,
            color: colors.mutedForeground,
            marginRight: 4,
          }}
        >
          {actionLabel}
        </Text>
        <ChevronRight size={14} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

// Category Row Component
function CategoryRow({
  name,
  spent,
  budget,
  color,
  percentage,
  colors,
  isLast,
  index,
}: {
  name: string;
  spent: number;
  budget: number;
  color: string;
  percentage: number;
  colors: ThemeColors;
  isLast: boolean;
  index: number;
}) {
  const isOverBudget = budget > 0 && spent > budget;
  const budgetUsed = budget > 0 ? (spent / budget) * 100 : null;

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withDelay(
      300 + index * 60,
      withTiming(Math.min(percentage, 100), {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [percentage, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: color,
              marginRight: 12,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }}
          />
          <Text
            style={{
              fontFamily: "DMSans_500Medium",
              fontSize: 14,
              color: colors.foreground,
              textTransform: "capitalize",
            }}
          >
            {name}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text
            style={{
              fontFamily: "DMSans_600SemiBold",
              fontSize: 14,
              color: isOverBudget ? colors.destructive : colors.foreground,
            }}
          >
            {formatCurrency(spent)}
          </Text>
          {budget > 0 && (
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 12,
                color: colors.mutedForeground,
                marginLeft: 4,
              }}
            >
              / {formatCurrency(budget)}
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 6,
          backgroundColor: oklchToHex("oklch(0.18 0.02 260)"),
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            {
              height: "100%",
              backgroundColor: color,
              borderRadius: 4,
            },
            animatedStyle,
          ]}
        />
      </View>

      {/* Budget indicator */}
      {budgetUsed !== null && (
        <Text
          style={{
            fontFamily: "DMSans_500Medium",
            fontSize: 10,
            color: isOverBudget
              ? colors.destructive
              : budgetUsed >= 80
              ? colors.warning
              : colors.mutedForeground,
            textAlign: "right",
            marginTop: 6,
          }}
        >
          {budgetUsed.toFixed(0)}% of budget
        </Text>
      )}
    </View>
  );
}

// Transaction Row Component
function TransactionRow({
  description,
  amount,
  date,
  categoryName,
  categoryColor,
  isConfirmed,
  colors,
  isLast,
  index,
}: {
  description: string;
  amount: number;
  date: string;
  categoryName?: string;
  categoryColor?: string;
  isConfirmed: boolean;
  colors: ThemeColors;
  isLast: boolean;
  index: number;
}) {
  const isExpense = amount < 0;
  const [, month, day] = date.split("-");

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(400 + index * 50)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      {/* Category color bar */}
      <View
        style={{
          width: 3,
          height: 36,
          borderRadius: 4,
          backgroundColor: categoryColor || colors.muted,
          marginRight: 14,
        }}
      />

      {/* Details */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            fontFamily: "DMSans_500Medium",
            fontSize: 14,
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {description}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 12,
              color: colors.mutedForeground,
            }}
          >
            {new Date(2024, parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          {categoryName ? (
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 12,
                color: colors.mutedForeground,
                marginLeft: 6,
                textTransform: "capitalize",
              }}
            >
              · {categoryName}
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 12,
                color: colors.primary,
                marginLeft: 6,
              }}
            >
              · Uncategorized
            </Text>
          )}
          {!isConfirmed && (
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.primary,
                marginLeft: 6,
              }}
            />
          )}
        </View>
      </View>

      {/* Amount */}
      <Text
        style={{
          fontFamily: "DMSans_600SemiBold",
          fontSize: 14,
          color: isExpense ? colors.foreground : colors.success,
        }}
      >
        {isExpense ? "-" : "+"}
        {formatCurrency(Math.abs(amount))}
      </Text>
    </Animated.View>
  );
}

// Quick Action Button - Horizontal layout with sublabel (matched to web)
function QuickAction({
  icon: Icon,
  label,
  sublabel,
  colors,
  isDark,
  isHighlight = false,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  colors: ThemeColors;
  isDark: boolean;
  isHighlight?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        width: "48%",  // 2 per row with gap
        backgroundColor: isHighlight
          ? isDark
            ? "rgba(58, 45, 112, 0.3)"  // oklch(0.2 0.06 260)
            : colors.primaryMuted
          : colors.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: isHighlight
          ? isDark ? "rgba(99, 102, 241, 0.3)" : colors.primary + "40"
          : isDark ? "rgba(46, 50, 66, 0.5)" : colors.border,  // Semi-transparent
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: isHighlight
            ? isDark ? "rgba(99, 102, 241, 0.3)" : colors.primary + "30"
            : isDark ? oklchToHex("oklch(0.18 0.02 260)") : colors.muted,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon
          size={16}
          color={isHighlight
            ? isDark ? oklchToHex("oklch(0.75 0.15 260)") : colors.primary
            : colors.mutedForeground}
        />
      </View>
      <View>
        <Text
          style={{
            fontFamily: "DMSans_500Medium",
            fontSize: 14,
            color: isHighlight ? colors.foreground : colors.foreground,
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

// Dashboard Skeleton
function DashboardSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ flex: 1 }}>
      {/* Hero skeleton */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ width: 80, height: 12, backgroundColor: colors.muted, borderRadius: 6, marginBottom: 16 }} />
        <View style={{ width: 200, height: 48, backgroundColor: colors.muted, borderRadius: 8, marginBottom: 16 }} />
        <View style={{ width: 120, height: 28, backgroundColor: colors.muted, borderRadius: 14 }} />
      </View>

      {/* Bento cards skeleton */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1, height: 140, backgroundColor: colors.muted, borderRadius: 16 }} />
        <View style={{ flex: 1, height: 140, backgroundColor: colors.muted, borderRadius: 16 }} />
      </View>

      {/* Budget bar skeleton */}
      <View style={{ height: 80, backgroundColor: colors.muted, borderRadius: 16, marginBottom: 24 }} />

      {/* Categories skeleton */}
      <View style={{ height: 200, backgroundColor: colors.muted, borderRadius: 16 }} />
    </View>
  );
}
