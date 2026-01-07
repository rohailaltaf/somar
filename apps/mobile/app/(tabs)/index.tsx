import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  Zap,
  ChevronRight,
  Wallet,
  Upload,
  TrendingUp,
  CreditCard,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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
  getPercentageChange,
  getBudgetProgress,
  getBudgetRemaining,
} from "@somar/shared";
import { spacing } from "@somar/shared/theme";
import { oklchToHex } from "@somar/shared/utils";
import { themeColors } from "@/src/lib/theme";
import { DashboardSectionHeader, QuickAction } from "@/src/components/ui";
import { TransactionRowAnimated } from "@/src/components/transactions";
import { CategoryRow } from "@/src/components/categories";
import {
  BentoCard,
  HeroCard,
  AtmosphericBackground,
  DashboardSkeleton,
} from "@/src/components/dashboard";

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

  const budgetProgress = getBudgetProgress(currentSpending, totalBudget);
  const budgetRemaining = getBudgetRemaining(currentSpending, totalBudget);

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
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing[4] }}>
        <DashboardSkeleton colors={colors} />
      </View>
    );
  }

  const hasData = recentTransactions.length > 0;
  const spendingValue = Math.abs(currentSpending);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Atmospheric Background - Deep Space Effect */}
      {isDark && <AtmosphericBackground />}

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
        {/* Hero Section */}
        <HeroCard
          currentMonth={currentMonth}
          spendingValue={spendingValue}
          previousSpending={previousSpending}
          percentChange={percentChange}
          totalBudget={totalBudget}
          budgetProgress={budgetProgress}
          budgetRemaining={budgetRemaining}
          colors={colors}
          isDark={isDark}
        />

        {/* Bento Grid - Cards Row */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={{
            flexDirection: "row",
            paddingHorizontal: spacing[4],
            gap: spacing[3],
            marginTop: spacing[2],
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
            <BentoCard colors={colors} isDark={isDark} accentColor={colors.warning}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colors.warning + "1A",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wallet size={20} color={colors.warning} />
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
            style={{ marginHorizontal: spacing[4], marginTop: spacing[6] }}
          >
            <DashboardSectionHeader
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
                marginTop: spacing[4],
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
            style={{ marginHorizontal: spacing[4], marginTop: spacing[6] }}
          >
            <DashboardSectionHeader
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
                marginTop: spacing[4],
              }}
            >
              {recentTransactions.map((tx, index) => (
                <TransactionRowAnimated
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
            style={{ marginHorizontal: spacing[4], marginTop: spacing[8] }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: spacing[10],
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
                  marginBottom: spacing[5],
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
                  marginBottom: spacing[2],
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

        {/* Quick Actions - 2x2 grid */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(600)}
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: spacing[4],
            gap: spacing[3],
            marginTop: spacing[6],
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
