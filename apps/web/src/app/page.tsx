"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  useSpendingByCategory,
  useTotalSpending,
  useUnconfirmedCount,
  useRecentTransactions,
  useAccounts,
} from "@somar/shared/hooks";
import { Nav } from "@/components/nav";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Upload,
  Zap,
  Wallet,
  PiggyBank,
  CreditCard,
  ChevronRight,
  Activity,
} from "lucide-react";
import {
  getCurrentMonth,
  getPreviousMonth,
  getPercentageChange,
  getBudgetProgress,
  getBudgetRemaining,
  formatMonth,
  formatCurrency,
} from "@somar/shared";

export default function DashboardPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-surface-deep">
      <Nav />
      <main className="relative">
        {/* Deep Space Background - subtle nebula effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] bg-[oklch(0.25_0.15_280_/_0.12)] rounded-full blur-[150px] animate-breathe" />
          <div className="absolute top-[30%] right-[-15%] w-[50vw] h-[60vh] bg-[oklch(0.35_0.12_200_/_0.08)] rounded-full blur-[120px] animate-breathe delay-300" />
          <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vh] bg-[oklch(0.45_0.18_260_/_0.06)] rounded-full blur-[100px]" />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(oklch(0.5 0.02 260) 1px, transparent 1px),
                               linear-gradient(90deg, oklch(0.5 0.02 260) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <DashboardContent />
        </div>
      </main>
    </div>
  );
}

function DashboardContent() {
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const previousMonth = useMemo(() => getPreviousMonth(currentMonth), [currentMonth]);

  const { data: categorySpending = [], isLoading: loadingSpending } =
    useSpendingByCategory(currentMonth);
  const { data: totalSpending = 0, isLoading: loadingTotal } =
    useTotalSpending(currentMonth);
  const { data: lastMonthSpending = 0 } = useTotalSpending(previousMonth);
  const { data: unconfirmedCount = 0, isLoading: loadingUnconfirmed } =
    useUnconfirmedCount();
  const { data: recentTransactions = [] } = useRecentTransactions(6);
  const { data: accounts = [] } = useAccounts();

  const isLoading = loadingSpending || loadingTotal || loadingUnconfirmed;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalBudget = categorySpending.reduce(
    (sum, cat) => sum + (cat.budget || 0),
    0
  );
  const budgetProgress = getBudgetProgress(totalSpending, totalBudget);
  const spendingChange = getPercentageChange(Math.abs(totalSpending), Math.abs(lastMonthSpending));
  const budgetRemaining = getBudgetRemaining(totalSpending, totalBudget);

  const topCategories = categorySpending
    .filter((cat) => cat.spent > 0)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Hero Section - Bento Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-12 gap-3 lg:gap-6"
      >
        {/* Main Spending Card - Large */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-12 lg:col-span-7 row-span-2"
        >
          <div className="relative h-full rounded-3xl overflow-hidden group">
            {/* Gradient border effect - decorative, stays inline */}
            <div
              className="absolute inset-0 rounded-3xl p-[1px]"
              style={{
                background: 'linear-gradient(135deg, oklch(0.35 0.15 260) 0%, oklch(0.25 0.1 280) 50%, oklch(0.2 0.08 300) 100%)',
              }}
            >
              <div className="absolute inset-[1px] rounded-3xl bg-surface" />
            </div>

            {/* Inner glow overlay - decorative, stays inline */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 20% 20%, oklch(0.4 0.15 260 / 0.15) 0%, transparent 50%)',
              }}
            />

            {/* Content */}
            <div className="relative h-full p-8 lg:p-10 flex flex-col justify-between min-h-[320px] lg:min-h-[380px]">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[0.6875rem] font-medium tracking-[0.15em] uppercase text-muted-foreground"
                  >
                    {formatMonth(currentMonth)}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-xs mt-1 text-foreground-secondary"
                  >
                    Total Spending
                  </motion.p>
                </div>

                {/* Trend Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <TrendBadge change={spendingChange} />
                </motion.div>
              </div>

              {/* Main Amount */}
              <div className="my-auto py-6">
                <AnimatedCurrency value={totalSpending} />
              </div>

              {/* Budget Progress */}
              {totalBudget > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget Progress</span>
                    <span className="font-medium text-foreground-secondary">
                      {formatCurrency(budgetRemaining)} left
                    </span>
                  </div>
                  <BudgetBar percentage={budgetProgress * 100} />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Uncategorized Alert Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-6 lg:col-span-5"
        >
          <Link href="/tagger" className="block h-full">
            <div className="relative h-full min-h-[160px] rounded-2xl overflow-hidden group transition-all duration-300">
              {/* Base background */}
              <div className="absolute inset-0 bg-background" />

              {/* Animated gradient border for unconfirmed - decorative, stays inline */}
              {unconfirmedCount > 0 && (
                <>
                  <div
                    className="absolute inset-0 rounded-2xl p-[1px] opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.5 0.18 260) 0%, oklch(0.4 0.15 280) 50%, oklch(0.5 0.18 260) 100%)',
                    }}
                  />
                  <div
                    className="absolute inset-[1px] rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.22 0.08 260) 0%, oklch(0.14 0.04 280) 100%)',
                    }}
                  />
                  <div className="absolute inset-0 rounded-2xl animate-pulse-glow bg-primary" />
                </>
              )}

              {/* Content */}
              <div className="relative h-full p-[16px] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl items-center justify-center flex ${unconfirmedCount > 0 ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Zap className={`w-5 h-5 ${unconfirmedCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <ChevronRight className="w-[16px] h-[16px] text-foreground-dim group-hover:translate-x-1 transition-all" />
                </div>

                <div className="pt-5">
                  <p className={`text-[28px] font-bold ${unconfirmedCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {unconfirmedCount}
                  </p>
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    {unconfirmedCount === 1 ? 'Transaction' : 'Transactions'} to categorize
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Accounts Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-6 lg:col-span-5"
        >
          <Link href="/accounts" className="block h-full">
            <div className="relative h-full min-h-[160px] rounded-2xl overflow-hidden group transition-all duration-300 hover:scale-[1.01] bg-background">
              {/* Subtle gold gradient on hover - decorative, stays inline */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(ellipse at 30% 30%, oklch(0.78 0.12 75 / 0.08) 0%, transparent 60%)',
                }}
              />

              {/* Border */}
              <div className="absolute inset-0 rounded-2xl border border-border-subtle" />

              {/* Content */}
              <div className="relative h-full p-[16px] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl items-center justify-center flex bg-gold/15">
                    <Wallet className="w-5 h-5 text-gold" />
                  </div>
                  <ChevronRight className="w-[16px] h-[16px] text-foreground-dim group-hover:translate-x-1 transition-all" />
                </div>

                <div className="pt-5">
                  <p className="text-[28px] font-bold text-foreground">
                    {accounts.length}
                  </p>
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    Connected {accounts.length === 1 ? 'Account' : 'Accounts'}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
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
          <div className="rounded-2xl bg-surface border border-border-subtle p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Spending Breakdown
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Where your money went this month
                </p>
              </div>
              <Link
                href="/categories"
                className="text-sm text-muted-foreground hover:text-foreground-secondary transition-colors flex items-center gap-1 group"
              >
                Manage
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
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
                icon={PiggyBank}
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
          <div className="rounded-2xl bg-surface border border-border-subtle p-6 lg:p-8 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Recent Activity
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Latest transactions
                </p>
              </div>
              <Link
                href="/transactions"
                className="text-sm text-muted-foreground hover:text-foreground-secondary transition-colors flex items-center gap-1 group"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
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
                icon={Activity}
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
        <QuickAction
          href="/upload"
          icon={Upload}
          label="Upload"
          sublabel="Import CSV"
        />
        <QuickAction
          href="/tagger"
          icon={Zap}
          label="Categorize"
          sublabel="Quick tagger"
          highlight={unconfirmedCount > 0}
        />
        <QuickAction
          href="/reports"
          icon={TrendingUp}
          label="Reports"
          sublabel="Analytics"
        />
        <QuickAction
          href="/accounts"
          icon={CreditCard}
          label="Accounts"
          sublabel="Manage"
        />
      </motion.section>
    </div>
  );
}

// Animated Currency Display
function AnimatedCurrency({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
    });

    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  const formatted = formatCurrency(displayValue);
  const [dollars, cents] = formatted.split(".");

  return (
    <div className="flex items-baseline gap-2">
      <motion.span
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="font-[family-name:var(--font-serif)] text-6xl sm:text-7xl lg:text-8xl tracking-tight leading-none text-foreground-bright"
      >
        {dollars}
      </motion.span>
      {cents && (
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-[family-name:var(--font-serif)] text-[2.5rem] text-foreground-dim"
        >
          .{cents}
        </motion.span>
      )}
    </div>
  );
}

// Trend Badge Component
function TrendBadge({ change }: { change: number | null }) {
  if (change === null) return null;

  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
        isUp
          ? 'bg-danger/15 text-danger-muted'
          : isDown
          ? 'bg-success/15 text-success-muted'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {isUp ? (
        <ArrowUpRight className="w-3.5 h-3.5" />
      ) : isDown ? (
        <ArrowDownRight className="w-3.5 h-3.5" />
      ) : null}
      {Math.abs(change)}%
      <span className="text-[0.65rem] opacity-70">vs last mo</span>
    </div>
  );
}

// Budget Bar Component - Gold/amber style
function BudgetBar({ percentage }: { percentage: number }) {
  const getColorClass = () => {
    if (percentage >= 100) return 'bg-danger';
    if (percentage >= 80) return 'bg-warning';
    return 'bg-gold';
  };

  const clampedPercentage = Math.min(percentage, 100);

  return (
    <div className="relative h-2 rounded-full overflow-hidden bg-muted">
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full ${getColorClass()}`}
        initial={{ width: 0 }}
        animate={{ width: `${clampedPercentage}%` }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Glow effect */}
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full blur-sm opacity-50 ${getColorClass()}`}
        initial={{ width: 0 }}
        animate={{ width: `${clampedPercentage}%` }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// Category Row Component
function CategoryRow({
  name,
  amount,
  budget,
  color,
  index,
}: {
  name: string;
  amount: number;
  budget: number | null;
  color: string;
  index: number;
}) {
  const isOverBudget = budget && amount > budget;
  const budgetUsed = budget ? (amount / budget) * 100 : null;

  const getProgressColor = () => {
    if (isOverBudget) return "var(--danger)";
    if (budgetUsed! >= 80) return "var(--warning)";
    return color;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.06, duration: 0.5 }}
      className="group"
    >
      <div className="flex items-center gap-4">
        {/* Color indicator */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
        />

        {/* Category info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground-secondary font-medium capitalize truncate">
              {name}
            </span>
            <div className="flex items-baseline gap-2 ml-2">
              <span
                className={`font-semibold tabular-nums ${
                  isOverBudget
                    ? "text-danger-muted"
                    : "text-foreground"
                }`}
              >
                {formatCurrency(amount)}
              </span>
              {budget && (
                <span className="text-xs text-foreground-dim">
                  / {formatCurrency(budget)}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar - only shown when budget exists */}
          {budget && (
            <>
              <div className="relative h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: getProgressColor() }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetUsed!, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <div className="flex justify-end mt-1">
                <span className={`text-[10px] font-medium ${
                  isOverBudget
                    ? "text-danger-muted"
                    : budgetUsed! >= 80
                    ? "text-warning"
                    : "text-muted-foreground"
                }`}>
                  {budgetUsed!.toFixed(0)}% of budget
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
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
  index,
}: {
  description: string;
  amount: number;
  date: string;
  categoryName?: string;
  categoryColor?: string;
  isConfirmed: boolean;
  index: number;
}) {
  const isExpense = amount < 0;
  const [, month, day] = date.split("-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.04, duration: 0.4 }}
      className="group flex items-center gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-surface-elevated transition-colors cursor-default"
    >
      {/* Category color bar */}
      <div
        className="w-[3px] h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: categoryColor || "var(--border)" }}
      />

      {/* Transaction details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate font-medium">
          {description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-foreground-dim">
            {new Date(2024, parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          {categoryName ? (
            <span className="text-xs text-muted-foreground capitalize">
              · {categoryName}
            </span>
          ) : (
            <span className="text-xs text-primary">
              · Uncategorized
            </span>
          )}
          {!isConfirmed && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </div>
      </div>

      {/* Amount */}
      <span
        className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
          isExpense
            ? "text-foreground-secondary"
            : "text-success-muted"
        }`}
      >
        {isExpense ? "-" : "+"}
        {formatCurrency(Math.abs(amount))}
      </span>
    </motion.div>
  );
}

// Quick Action Component
function QuickAction({
  href,
  icon: Icon,
  label,
  sublabel,
  highlight = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`relative rounded-2xl p-4 transition-all duration-150 group hover:-translate-y-0.5 active:scale-[0.98] ${
          highlight
            ? "bg-gradient-to-br from-primary/15 to-surface border border-primary/30"
            : "bg-background border border-border-subtle hover:border-border"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              highlight
                ? "bg-primary/30"
                : "bg-surface-elevated"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                highlight
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground-secondary"
              } transition-colors`}
            />
          </div>
          <div>
            <p
              className={`text-sm font-medium ${
                highlight
                  ? "text-foreground"
                  : "text-foreground-secondary"
              }`}
            >
              {label}
            </p>
            <p className="text-xs text-foreground-dim">{sublabel}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-foreground-dim" />
      </div>
      <p className="text-foreground-secondary font-medium">{title}</p>
      <p className="text-sm text-foreground-dim mt-1 max-w-[200px]">
        {description}
      </p>
      <Link
        href={action.href}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {action.label}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// Skeleton Loading State
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Grid Skeleton */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 lg:col-span-7 row-span-2">
          <div className="h-[380px] rounded-3xl bg-surface animate-pulse" />
        </div>
        <div className="col-span-6 lg:col-span-5">
          <div className="h-[160px] rounded-2xl bg-surface animate-pulse" />
        </div>
        <div className="col-span-6 lg:col-span-5">
          <div className="h-[160px] rounded-2xl bg-surface animate-pulse" />
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-2xl bg-surface p-8 space-y-6">
            <div className="h-8 w-48 bg-surface-elevated rounded animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-surface-elevated rounded animate-pulse" />
                  <div className="h-4 w-20 bg-surface-elevated rounded animate-pulse" />
                </div>
                <div className="h-1.5 bg-surface-elevated rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-2xl bg-surface p-8 space-y-4 h-full">
            <div className="h-8 w-40 bg-surface-elevated rounded animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-elevated rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
