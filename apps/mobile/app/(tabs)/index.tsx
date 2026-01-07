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
  // colors needed for: RefreshControl, Lucide icons, child component props
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
      <View className="flex-1 bg-background p-4">
        <DashboardSkeleton />
      </View>
    );
  }

  const hasData = recentTransactions.length > 0;
  const spendingValue = Math.abs(currentSpending);

  return (
    <View className="flex-1 bg-background">
      {/* Atmospheric Background - Deep Space Effect */}
      {isDark && <AtmosphericBackground />}

      <ScrollView
        className="flex-1"
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
          className="flex-row px-4 gap-3 mt-2"
        >
          {/* Uncategorized Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/transactions");
            }}
            className="flex-1"
          >
            <BentoCard
              colors={colors}
              isDark={isDark}
              isHighlight={unconfirmedCount > 0}
            >
              <View className="flex-row justify-between items-start">
                <View
                  className={`w-11 h-11 rounded-xl items-center justify-center ${
                    unconfirmedCount > 0 ? "bg-primary/20" : "bg-muted"
                  }`}
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
              <View className="mt-auto pt-5">
                <Text
                  className={`font-bold text-[28px] ${
                    unconfirmedCount > 0 ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {unconfirmedCount}
                </Text>
                <Text className="font-sans text-xs text-muted-foreground mt-0.5">
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
            className="flex-1"
          >
            <BentoCard colors={colors} isDark={isDark} accentColor={colors.warning}>
              <View className="flex-row justify-between items-start">
                <View className="w-11 h-11 rounded-xl items-center justify-center bg-warning/10">
                  <Wallet size={20} color={colors.warning} />
                </View>
                <ChevronRight
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              <View className="mt-auto pt-5">
                <Text className="font-bold text-foreground text-[28px]">
                  {accounts.length}
                </Text>
                <Text className="font-sans text-xs text-muted-foreground mt-0.5">
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
            className="mx-4 mt-6"
          >
            <DashboardSectionHeader
              title="Spending Breakdown"
              subtitle="Where your money went"
              actionLabel="Manage"
              onAction={() => router.push("/categories" as never)}
              colors={colors}
            />

            <View
              className="rounded-2xl overflow-hidden border mt-4"
              style={{
                backgroundColor: isDark ? oklchToHex("oklch(0.12 0.02 260)") : colors.card,
                borderColor: isDark ? "rgba(46, 50, 66, 0.5)" : colors.border,
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
            className="mx-4 mt-6"
          >
            <DashboardSectionHeader
              title="Recent Activity"
              subtitle="Latest transactions"
              actionLabel="View all"
              onAction={() => router.push("/(tabs)/transactions")}
              colors={colors}
            />

            <View
              className="rounded-2xl overflow-hidden border mt-4"
              style={{
                backgroundColor: isDark ? oklchToHex("oklch(0.12 0.02 260)") : colors.card,
                borderColor: isDark ? "rgba(46, 50, 66, 0.5)" : colors.border,
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
            className="mx-4 mt-8"
          >
            <View className="bg-card rounded-2xl p-10 items-center border border-border">
              <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-5">
                <Wallet size={28} color={colors.mutedForeground} />
              </View>
              <Text className="font-semibold text-foreground text-[17px] text-center mb-2">
                No transactions yet
              </Text>
              <Text className="font-sans text-muted-foreground text-sm text-center leading-5 max-w-[240px]">
                Connect your bank or import transactions on the web app to see your spending here.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions - 2x2 grid */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(600)}
          className="flex-row flex-wrap px-4 gap-3 mt-6"
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
