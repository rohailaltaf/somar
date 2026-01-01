import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useTotalSpending,
  useSpendingByCategory,
  useCategoriesWithBudgets,
  useRecentTransactions,
  useUnconfirmedCount,
  useDatabaseAdapter,
} from "@somar/shared/hooks";
import {
  getCurrentMonth,
  getPreviousMonth,
  formatMonth,
  getPercentageChange,
} from "@somar/shared";
import {
  AmountDisplayLarge,
  CardWithHeader,
  ProgressBar,
  TransactionRowCompact,
  DashboardCardSkeleton,
} from "../../src/components/ui";

export default function Dashboard() {
  const router = useRouter();
  const { isReady: dbReady } = useDatabaseAdapter();
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const previousMonth = useMemo(() => getPreviousMonth(), []);

  // Data hooks
  const { data: currentSpending = 0, isLoading: loadingCurrent, refetch: refetchCurrent } = useTotalSpending(currentMonth);
  const { data: previousSpending = 0 } = useTotalSpending(previousMonth);
  const { data: spendingByCategory = [], refetch: refetchByCategory } = useSpendingByCategory(currentMonth);
  const { data: categoriesWithBudgets = [] } = useCategoriesWithBudgets(currentMonth);
  const { data: recentTransactions = [], refetch: refetchTransactions } = useRecentTransactions(5);
  const { data: unconfirmedCount = 0 } = useUnconfirmedCount();

  // Calculate change from last month
  const percentChange = useMemo(
    () => getPercentageChange(Math.abs(currentSpending), Math.abs(previousSpending)),
    [currentSpending, previousSpending]
  );

  // Get top spending categories with budgets
  const categoryProgress = useMemo(() => {
    return spendingByCategory
      .slice(0, 4)
      .map((cat) => {
        const budget = categoriesWithBudgets.find((b) => b.id === cat.id);
        const spent = cat.spent;
        const budgetAmount = budget?.currentBudget?.amount || 0;
        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          spent,
          budget: budgetAmount,
          progress: budgetAmount > 0 ? spent / budgetAmount : 0,
        };
      });
  }, [spendingByCategory, categoriesWithBudgets]);

  const handleRefresh = async () => {
    await Promise.all([refetchCurrent(), refetchByCategory(), refetchTransactions()]);
  };

  // Show skeletons until database is ready and initial data is loaded
  const isLoading = !dbReady || loadingCurrent;

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background px-4 pt-4">
        <DashboardCardSkeleton />
        <View className="h-4" />
        <DashboardCardSkeleton />
      </ScrollView>
    );
  }

  const hasData = recentTransactions.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor="#6366f1" />
      }
    >
      {/* Hero Spending Card */}
      <View className="px-4 pt-4">
        <View className="bg-card rounded-2xl p-6 border border-border">
          <Text className="text-sm font-medium text-muted-foreground mb-1">
            {formatMonth(currentMonth)}
          </Text>
          <AmountDisplayLarge amount={currentSpending} colorMode="neutral" />

          {previousSpending !== 0 && percentChange !== null && (
            <View className="flex-row items-center mt-2">
              <Ionicons
                name={percentChange <= 0 ? "trending-down" : "trending-up"}
                size={16}
                color={percentChange <= 0 ? "#22c55e" : "#ef4444"}
              />
              <Text
                className={`text-sm font-medium ml-1 ${
                  percentChange <= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {Math.abs(percentChange)}%
              </Text>
              <Text className="text-sm text-muted-foreground ml-1">
                vs last month
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Unconfirmed Alert */}
      {unconfirmedCount > 0 && (
        <View className="px-4 mt-4">
          <Pressable
            className="bg-primary-muted border border-primary/20 rounded-xl p-4 flex-row items-center"
            onPress={() => router.push("/(tabs)/transactions")}
          >
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
              <Ionicons name="pricetag-outline" size={20} color="#6366f1" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-foreground">
                {unconfirmedCount} transaction{unconfirmedCount !== 1 ? "s" : ""} need{unconfirmedCount === 1 ? "s" : ""} review
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Tap to categorize
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </View>
      )}

      {/* Budget Progress */}
      {categoryProgress.length > 0 && (
        <View className="mt-6">
          <CardWithHeader title="Budgets" className="mx-4">
            <View className="px-5 pb-4">
              {categoryProgress.map((cat, index) => (
                <View key={cat.id} className={index > 0 ? "mt-4" : ""}>
                  <View className="flex-row justify-between items-baseline mb-1.5">
                    <Text className="text-sm font-medium text-foreground capitalize">
                      {cat.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      ${cat.spent.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      {cat.budget > 0 && (
                        <Text className="text-text-tertiary">
                          {" / "}${cat.budget.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                        </Text>
                      )}
                    </Text>
                  </View>
                  <ProgressBar progress={cat.progress} size="md" />
                </View>
              ))}
            </View>
          </CardWithHeader>
        </View>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <View className="mt-6">
          <CardWithHeader
            title="Recent"
            action="See all"
            onActionPress={() => router.push("/(tabs)/transactions")}
            className="mx-4"
          >
            <View className="px-5 pb-3">
              {recentTransactions.map((transaction, index) => (
                <View key={transaction.id}>
                  {index > 0 && <View className="h-px bg-border-subtle my-1" />}
                  <TransactionRowCompact transaction={transaction} />
                </View>
              ))}
            </View>
          </CardWithHeader>
        </View>
      )}

      {/* Empty State */}
      {!hasData && (
        <View className="px-4 mt-6">
          <View className="bg-card rounded-2xl p-8 border border-border items-center">
            <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
              <Ionicons name="wallet-outline" size={32} color="#94a3b8" />
            </View>
            <Text className="text-lg font-semibold text-foreground text-center mb-2">
              Get started
            </Text>
            <Text className="text-sm text-muted-foreground text-center leading-5">
              Connect your bank or import transactions on the web app to see your spending here.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
