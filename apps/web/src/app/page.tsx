"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSpendingByCategory,
  useTotalSpending,
  useUnconfirmedCount,
  useRecentTransactions,
} from "@somar/shared/hooks";
import { Nav } from "@/components/nav";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  TrendingUp,
  Upload,
  Tags,
  Zap,
} from "lucide-react";
import {
  getCurrentMonth,
  getPreviousMonth,
  formatMonth,
  formatCurrency,
} from "@somar/shared";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_260)] dashboard-premium">
      <Nav />
      <main className="relative overflow-hidden">
        {/* Atmospheric Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-[oklch(0.35_0.12_260_/_0.15)] rounded-full blur-[120px] animate-breathe" />
          <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-[oklch(0.78_0.12_75_/_0.08)] rounded-full blur-[100px] animate-breathe delay-200" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-[oklch(0.45_0.18_260_/_0.1)] rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
  const { data: recentTransactions = [] } = useRecentTransactions(5);

  const isLoading = loadingSpending || loadingTotal || loadingUnconfirmed;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalBudget = categorySpending.reduce(
    (sum, cat) => sum + (cat.budget || 0),
    0
  );
  const budgetPercentage = totalBudget > 0 ? (totalSpending / totalBudget) * 100 : 0;
  const spendingChange = lastMonthSpending > 0
    ? ((totalSpending - lastMonthSpending) / lastMonthSpending) * 100
    : 0;

  const topCategories = [...categorySpending]
    .filter((cat) => cat.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const maxSpending = Math.max(...topCategories.map((c) => c.spent), 1);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Main Spending Display */}
          <div className="space-y-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[oklch(0.65_0.02_260)] text-sm font-medium tracking-widest uppercase"
            >
              {formatMonth(currentMonth)} Spending
            </motion.p>
            <div className="relative">
              <AnimatedCounter value={totalSpending} />
              {/* Trend Indicator */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -right-4 top-4 lg:relative lg:right-auto lg:top-auto lg:mt-4"
              >
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    spendingChange > 0
                      ? "bg-[oklch(0.55_0.22_25_/_0.15)] text-[oklch(0.7_0.18_25)]"
                      : spendingChange < 0
                      ? "bg-[oklch(0.6_0.18_145_/_0.15)] text-[oklch(0.75_0.15_145)]"
                      : "bg-[oklch(0.3_0.02_260)] text-[oklch(0.65_0.02_260)]"
                  }`}
                >
                  {spendingChange > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : spendingChange < 0 ? (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  ) : null}
                  {Math.abs(spendingChange).toFixed(0)}% vs last month
                </div>
              </motion.div>
            </div>
          </div>

          {/* Budget Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-6"
          >
            <BudgetRing percentage={budgetPercentage} size={140} />
            <div className="space-y-1">
              <p className="text-[oklch(0.5_0.02_260)] text-sm">Budget Used</p>
              <p className="text-2xl font-semibold text-[oklch(0.95_0.01_260)]">
                {totalBudget > 0 ? `${Math.min(budgetPercentage, 100).toFixed(0)}%` : "—"}
              </p>
              {totalBudget > 0 && (
                <p className="text-sm text-[oklch(0.5_0.02_260)]">
                  {formatCurrency(Math.max(0, totalBudget - totalSpending))} left
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Unconfirmed Alert */}
      <AnimatePresence>
        {unconfirmedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/tagger">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[oklch(0.45_0.18_260)] to-[oklch(0.55_0.15_280)] p-[1px] transition-all hover:shadow-[0_0_40px_oklch(0.45_0.18_260_/_0.3)]">
                <div className="relative flex items-center justify-between rounded-2xl bg-[oklch(0.13_0.02_260)] px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.45_0.18_260_/_0.2)]">
                      <Sparkles className="h-5 w-5 text-[oklch(0.75_0.15_260)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[oklch(0.95_0.01_260)]">
                        {unconfirmedCount} transaction{unconfirmedCount !== 1 ? "s" : ""} need categorization
                      </p>
                      <p className="text-sm text-[oklch(0.55_0.02_260)]">
                        Swipe through them in the Tagger
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[oklch(0.65_0.02_260)] transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Category Breakdown - Takes 3 columns */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-serif)] text-2xl text-[oklch(0.95_0.01_260)]">
              Where your money went
            </h2>
            <Link
              href="/categories"
              className="text-sm text-[oklch(0.55_0.02_260)] hover:text-[oklch(0.75_0.02_260)] transition-colors flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {topCategories.length > 0 ? (
              topCategories.map((category, index) => (
                <CategoryBar
                  key={category.id}
                  name={category.name}
                  amount={category.spent}
                  budget={category.budget}
                  color={category.color}
                  percentage={(category.spent / maxSpending) * 100}
                  index={index}
                />
              ))
            ) : (
              <EmptyState
                title="No spending yet"
                description="Upload transactions or connect your bank to see your spending breakdown"
                action={{ href: "/upload", label: "Upload CSV" }}
              />
            )}
          </div>
        </motion.section>

        {/* Recent Transactions - Takes 2 columns */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-serif)] text-2xl text-[oklch(0.95_0.01_260)]">
              Recent Activity
            </h2>
            <Link
              href="/transactions"
              className="text-sm text-[oklch(0.55_0.02_260)] hover:text-[oklch(0.75_0.02_260)] transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx, index) => (
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
              ))
            ) : (
              <EmptyState
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
        transition={{ delay: 0.7 }}
        className="grid sm:grid-cols-3 gap-4"
      >
        <QuickActionCard
          href="/upload"
          icon={Upload}
          title="Upload CSV"
          description="Import bank exports"
        />
        <QuickActionCard
          href="/tagger"
          icon={Zap}
          title="Categorize"
          description="Swipe through transactions"
          highlight={unconfirmedCount > 0}
        />
        <QuickActionCard
          href="/reports"
          icon={TrendingUp}
          title="Reports"
          description="Spending insights"
        />
      </motion.section>
    </div>
  );
}

// Animated Counter Component
function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(startValue + (value - startValue) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formatted = formatCurrency(displayValue);
  const [dollars, cents] = formatted.split(".");

  return (
    <div ref={ref} className="flex items-baseline gap-1">
      <span className="font-[family-name:var(--font-serif)] text-7xl sm:text-8xl lg:text-9xl tracking-tight text-[oklch(0.98_0.01_260)]">
        {dollars}
      </span>
      {cents && (
        <span className="font-[family-name:var(--font-serif)] text-4xl sm:text-5xl text-[oklch(0.5_0.02_260)]">
          .{cents}
        </span>
      )}
    </div>
  );
}

// Budget Ring Component
function BudgetRing({ percentage, size }: { percentage: number; size: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const getColor = () => {
    if (percentage >= 100) return "oklch(0.6 0.2 25)"; // Red
    if (percentage >= 80) return "oklch(0.75 0.18 85)"; // Amber
    return "oklch(0.7 0.15 145)"; // Green
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="ring-progress" width={size} height={size}>
        {/* Background track */}
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress fill */}
        <motion.circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={getColor()}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${getColor()}20` }}
        >
          <TrendingUp className="w-6 h-6" style={{ color: getColor() }} />
        </div>
      </div>
    </div>
  );
}

// Category Bar Component
function CategoryBar({
  name,
  amount,
  budget,
  color,
  percentage,
  index,
}: {
  name: string;
  amount: number;
  budget: number | null;
  color: string;
  percentage: number;
  index: number;
}) {
  const isOverBudget = budget && amount > budget;
  const budgetPercentage = budget ? (amount / budget) * 100 : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.08 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-[oklch(0.85_0.01_260)] font-medium capitalize">
            {name}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`font-semibold ${
              isOverBudget ? "text-[oklch(0.7_0.18_25)]" : "text-[oklch(0.95_0.01_260)]"
            }`}
          >
            {formatCurrency(amount)}
          </span>
          {budget && (
            <span className="text-sm text-[oklch(0.45_0.02_260)]">
              / {formatCurrency(budget)}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-[oklch(0.2_0.02_260)] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, delay: 0.6 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Budget marker */}
        {budget && budgetPercentage && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[oklch(0.5_0.02_260)]"
            style={{
              left: `${Math.min((amount / budget) * percentage / (percentage / 100), 100)}%`,
              opacity: budgetPercentage > 100 ? 0 : 1,
            }}
          />
        )}
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
      transition={{ delay: 0.6 + index * 0.05 }}
      className="group flex items-center gap-4 p-3 rounded-xl hover:bg-[oklch(0.18_0.02_260)] transition-colors"
    >
      {/* Date */}
      <div className="w-10 text-center">
        <p className="text-lg font-semibold text-[oklch(0.85_0.01_260)]">{parseInt(day)}</p>
        <p className="text-xs text-[oklch(0.45_0.02_260)] uppercase">
          {new Date(2024, parseInt(month) - 1).toLocaleString("default", { month: "short" })}
        </p>
      </div>

      {/* Category indicator */}
      <div
        className="w-1 h-10 rounded-full"
        style={{
          backgroundColor: categoryColor || "oklch(0.35 0.02 260)",
        }}
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-[oklch(0.9_0.01_260)] truncate">{description}</p>
        <div className="flex items-center gap-2">
          {categoryName ? (
            <span className="text-xs text-[oklch(0.5_0.02_260)] capitalize">
              {categoryName}
            </span>
          ) : (
            <span className="text-xs text-[oklch(0.45_0.18_260)]">Uncategorized</span>
          )}
          {!isConfirmed && (
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.6_0.18_260)]" />
          )}
        </div>
      </div>

      {/* Amount */}
      <p
        className={`font-semibold tabular-nums ${
          isExpense ? "text-[oklch(0.85_0.01_260)]" : "text-[oklch(0.7_0.15_145)]"
        }`}
      >
        {isExpense ? "-" : "+"}
        {formatCurrency(Math.abs(amount))}
      </p>
    </motion.div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  highlight = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
          highlight
            ? "bg-gradient-to-br from-[oklch(0.25_0.08_260)] to-[oklch(0.18_0.04_260)] border border-[oklch(0.45_0.18_260_/_0.3)]"
            : "bg-[oklch(0.16_0.02_260)] border border-[oklch(0.25_0.02_260)] hover:border-[oklch(0.35_0.02_260)]"
        }`}
      >
        <div className="flex items-start justify-between">
          <div
            className={`p-3 rounded-xl ${
              highlight
                ? "bg-[oklch(0.45_0.18_260_/_0.2)]"
                : "bg-[oklch(0.22_0.02_260)]"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                highlight ? "text-[oklch(0.75_0.15_260)]" : "text-[oklch(0.65_0.02_260)]"
              }`}
            />
          </div>
          <ArrowUpRight
            className={`w-4 h-4 opacity-0 -translate-x-2 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 ${
              highlight ? "text-[oklch(0.75_0.15_260)]" : "text-[oklch(0.5_0.02_260)]"
            }`}
          />
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-[oklch(0.95_0.01_260)]">{title}</h3>
          <p className="text-sm text-[oklch(0.5_0.02_260)] mt-1">{description}</p>
        </div>
      </motion.div>
    </Link>
  );
}

// Empty State Component
function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[oklch(0.2_0.02_260)] flex items-center justify-center mb-4">
        <Tags className="w-6 h-6 text-[oklch(0.45_0.02_260)]" />
      </div>
      <p className="text-[oklch(0.75_0.02_260)] font-medium">{title}</p>
      <p className="text-sm text-[oklch(0.45_0.02_260)] mt-1 max-w-xs">{description}</p>
      <Link
        href={action.href}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[oklch(0.45_0.18_260)] text-[oklch(0.98_0.01_260)] text-sm font-medium hover:bg-[oklch(0.5_0.18_260)] transition-colors"
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
    <div className="space-y-16 animate-pulse">
      {/* Hero skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-[oklch(0.2_0.02_260)] rounded" />
          <div className="h-24 w-80 bg-[oklch(0.18_0.02_260)] rounded-lg" />
        </div>
        <div className="flex items-center gap-6">
          <div className="w-[140px] h-[140px] rounded-full bg-[oklch(0.18_0.02_260)]" />
          <div className="space-y-2">
            <div className="h-4 w-20 bg-[oklch(0.2_0.02_260)] rounded" />
            <div className="h-8 w-16 bg-[oklch(0.2_0.02_260)] rounded" />
          </div>
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="h-8 w-48 bg-[oklch(0.18_0.02_260)] rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-[oklch(0.18_0.02_260)] rounded" />
                <div className="h-4 w-20 bg-[oklch(0.18_0.02_260)] rounded" />
              </div>
              <div className="h-2 bg-[oklch(0.18_0.02_260)] rounded-full" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 w-40 bg-[oklch(0.18_0.02_260)] rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[oklch(0.16_0.02_260)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
