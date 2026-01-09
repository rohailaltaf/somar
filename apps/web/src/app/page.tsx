"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  useSpendingByCategory,
  useTotalSpending,
  useUnconfirmedCount,
  useRecentTransactions,
  useAccounts,
} from "@somar/shared/hooks";
import { Nav } from "@/components/nav";
import { EmptyState } from "@/components/ui/empty-state";
import {
  HeroCard,
  StatCard,
  CategoryRow,
  TransactionRow,
  QuickAction,
  DashboardSkeleton,
  AtmosphericBackground,
  DashboardSectionHeader,
} from "@/components/dashboard";
import {
  TrendingUp,
  Upload,
  Zap,
  Wallet,
  CreditCard,
} from "lucide-react";
import {
  getCurrentMonth,
  getPreviousMonth,
  getPercentageChange,
  getBudgetProgress,
  getBudgetRemaining,
  type TransactionWithRelations,
  type Account,
} from "@somar/shared";

export default function DashboardPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-surface-deep">
      <Nav />
      <main className="relative">
        {/* Deep Space Background */}
        <AtmosphericBackground />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <DashboardContent />
        </div>
      </main>
    </div>
  );
}

interface CategorySpendingItem {
  id: string;
  name: string;
  color: string;
  spent: number;
  budget: number | null;
}

function DashboardContent() {
  const router = useRouter();
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const previousMonth = useMemo(() => getPreviousMonth(currentMonth), [currentMonth]);

  const spendingResult = useSpendingByCategory(currentMonth);
  const categorySpending: CategorySpendingItem[] = spendingResult.data ?? [];
  const loadingSpending = spendingResult.isLoading;
  const { data: totalSpending = 0, isLoading: loadingTotal } =
    useTotalSpending(currentMonth);
  const { data: lastMonthSpending = 0 } = useTotalSpending(previousMonth);
  const { data: unconfirmedCount = 0, isLoading: loadingUnconfirmed } =
    useUnconfirmedCount();
  const transactionsResult = useRecentTransactions(6);
  const recentTransactions: TransactionWithRelations[] = transactionsResult.data ?? [];
  const accountsResult = useAccounts();
  const accounts: Account[] = accountsResult.data ?? [];

  const isLoading = loadingSpending || loadingTotal || loadingUnconfirmed;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalBudget = categorySpending.reduce((sum, cat) => sum + (cat.budget || 0), 0);
  const budgetProgress = getBudgetProgress(totalSpending, totalBudget);
  const spendingChange = getPercentageChange(Math.abs(totalSpending), Math.abs(lastMonthSpending));
  const budgetRemaining = getBudgetRemaining(totalSpending, totalBudget);

  const topCategories = categorySpending.filter((cat) => cat.spent > 0).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Hero Section - Bento Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-12 gap-3 lg:gap-6"
      >
        <HeroCard
          currentMonth={currentMonth}
          totalSpending={totalSpending}
          spendingChange={spendingChange}
          budgetProgress={budgetProgress}
          budgetRemaining={budgetRemaining}
          hasBudget={totalBudget > 0}
        />

        <StatCard
          href="/tagger"
          icon={Zap}
          iconColorClass={unconfirmedCount > 0 ? "text-primary" : "text-muted-foreground"}
          iconBgClass={unconfirmedCount > 0 ? "bg-primary/20" : "bg-muted"}
          value={unconfirmedCount}
          label={`${unconfirmedCount === 1 ? "Transaction" : "Transactions"} to categorize`}
          highlight={unconfirmedCount > 0}
          delay={0.1}
        />

        <StatCard
          href="/accounts"
          icon={Wallet}
          iconColorClass="text-gold"
          iconBgClass="bg-gold/15"
          value={accounts.length}
          label={`Connected ${accounts.length === 1 ? "Account" : "Accounts"}`}
          delay={0.15}
        />
      </motion.div>

      {/* Category & Transactions Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Category Breakdown */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="col-span-12 lg:col-span-7"
        >
          <div className="rounded-2xl overflow-hidden bg-surface border border-border-subtle p-6 lg:p-8">
            <div className="mb-8">
              <DashboardSectionHeader
                title="Spending Breakdown"
                subtitle="Where your money went this month"
                actionLabel="Manage"
                onAction={() => router.push("/categories")}
              />
            </div>

            {topCategories.length > 0 ? (
              <div className="space-y-5">
                {topCategories.map((category, index) => (
                  <CategoryRow
                    key={category.id}
                    name={category.name}
                    amount={category.spent}
                    budget={category.budget}
                    color={category.color}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="PiggyBank"
                title="No spending yet"
                description="Upload transactions or connect your bank to see your spending breakdown"
                action={{ href: "/upload", label: "Upload CSV" }}
              />
            )}
          </div>
        </motion.section>

        {/* Recent Transactions */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="col-span-12 lg:col-span-5"
        >
          <div className="rounded-2xl overflow-hidden bg-surface border border-border-subtle p-6 lg:p-8 h-full">
            <div className="mb-6">
              <DashboardSectionHeader
                title="Recent Activity"
                subtitle="Latest transactions"
                actionLabel="View all"
                onAction={() => router.push("/transactions")}
              />
            </div>

            {recentTransactions.length > 0 ? (
              <div className="space-y-1">
                {recentTransactions.map((tx, index) => (
                  <TransactionRow
                    key={tx.id}
                    description={tx.description}
                    amount={tx.amount}
                    date={tx.date}
                    categoryName={tx.category?.name}
                    categoryColor={tx.category?.color}
                    isConfirmed={tx.isConfirmed}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="Activity"
                title="No transactions"
                description="Get started by uploading a CSV or connecting your bank"
                action={{ href: "/accounts", label: "Connect Bank" }}
              />
            )}
          </div>
        </motion.section>
      </div>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4"
      >
        <QuickAction href="/upload" icon={Upload} label="Upload" sublabel="Import CSV" />
        <QuickAction
          href="/tagger"
          icon={Zap}
          label="Categorize"
          sublabel="Quick tagger"
          highlight={unconfirmedCount > 0}
        />
        <QuickAction href="/reports" icon={TrendingUp} label="Reports" sublabel="Analytics" />
        <QuickAction href="/accounts" icon={CreditCard} label="Accounts" sublabel="Manage" />
      </motion.section>
    </div>
  );
}
