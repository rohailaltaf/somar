import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Zap,
  Wallet,
  Upload,
  TrendingUp,
  CreditCard,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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
import { colors } from "@/src/lib/theme";
import { hexColors } from "@somar/shared/theme";
import {
  StatCard,
  HeroCard,
  AtmosphericBackground,
  DashboardSkeleton,
  CategoryRow,
  TransactionRow,
  QuickAction,
  DashboardSectionHeader,
} from "@/src/components/dashboard";
import { EmptyState } from "@/src/components/ui/empty-state";

export default function Dashboard() {
  const router = useRouter();
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
      <AtmosphericBackground />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
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
          totalSpending={spendingValue}
          spendingChange={percentChange}
          budgetProgress={budgetProgress}
          budgetRemaining={budgetRemaining}
          hasBudget={totalBudget > 0}
        />

        {/* Bento Grid - Cards Row */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          className="flex-row px-4 gap-3 mt-2"
        >
          {/* Uncategorized Card */}
          <StatCard
            icon={Zap}
            iconColorClass={unconfirmedCount > 0 ? "text-primary" : "text-muted-foreground"}
            value={unconfirmedCount}
            label={unconfirmedCount === 1 ? "Transaction to categorize" : "Transactions to categorize"}
            highlight={unconfirmedCount > 0}
            onPress={() => router.push("/(tabs)/transactions")}
          />

          {/* Accounts Card */}
          <StatCard
            icon={Wallet}
            iconColorClass="text-gold"
            value={accounts.length}
            label={accounts.length === 1 ? "Connected Account" : "Connected Accounts"}
            onPress={() => router.push("/(tabs)/wallet")}
          />
        </Animated.View>

        {/* Category Breakdown */}
        {categoryProgress.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            className="mx-4 mt-6"
          >
            <View className="rounded-2xl overflow-hidden border border-border-subtle bg-surface">
              <View className="px-5 pt-5 pb-4">
                <DashboardSectionHeader
                  title="Spending Breakdown"
                  subtitle="Where your money went"
                  actionLabel="Manage"
                  onAction={() => router.push("/categories" as never)}
                />
              </View>
              {categoryProgress.map((cat, index) => (
                <CategoryRow
                  key={cat.id}
                  name={cat.name}
                  amount={cat.spent}
                  budget={cat.budget > 0 ? cat.budget : null}
                  color={cat.color}
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
            <View className="rounded-2xl overflow-hidden border border-border-subtle bg-surface">
              <View className="px-5 pt-5 pb-4">
                <DashboardSectionHeader
                  title="Recent Activity"
                  subtitle="Latest transactions"
                  actionLabel="View all"
                  onAction={() => router.push("/(tabs)/transactions")}
                />
              </View>
              {recentTransactions.map((tx, index) => (
                <View
                  key={tx.id}
                  style={{
                    borderBottomWidth: index === recentTransactions.length - 1 ? 0 : 1,
                    borderBottomColor: hexColors.borderSubtle,
                  }}
                >
                  <TransactionRow
                    description={tx.description}
                    amount={tx.amount}
                    date={tx.date}
                    categoryName={tx.category?.name}
                    categoryColor={tx.category?.color ? oklchToHex(tx.category.color) : undefined}
                    isConfirmed={tx.isConfirmed}
                    index={index}
                  />
                </View>
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
            <View className="bg-card rounded-2xl border border-border">
              <EmptyState
                icon="Wallet"
                title="No transactions yet"
                description="Connect your bank or import transactions on the web app to see your spending here."
                size="compact"
              />
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
          />
          <QuickAction
            icon={Zap}
            label="Categorize"
            sublabel="Quick tagger"
            highlight={unconfirmedCount > 0}
            onPress={() => router.push("/(tabs)/transactions")}
          />
          <QuickAction
            icon={TrendingUp}
            label="Reports"
            sublabel="Analytics"
          />
          <QuickAction
            icon={CreditCard}
            label="Accounts"
            sublabel="Manage"
            onPress={() => router.push("/(tabs)/wallet")}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
