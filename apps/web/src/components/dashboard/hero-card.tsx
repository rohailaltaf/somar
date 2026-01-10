"use client";

import { motion } from "framer-motion";
import { formatMonth, formatCurrency } from "@somar/shared";
import {
  heroCardStyles,
  getHeroGradientCSS,
  getHeroGlowCSS,
  type HeroCardProps,
} from "@somar/shared/styles";
import { AnimatedCurrency } from "./animated-currency";
import { TrendBadge } from "../ui/trend-badge";
import { ProgressBar } from "../ui/progress-bar";

/**
 * Main hero card displaying total spending for the month.
 * Features gradient border, animated currency, and budget progress.
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="col-span-12 lg:col-span-7 row-span-2"
    >
      <div className={`relative h-full ${heroCardStyles.layout.gradientWrapper} group`}>
        {/* Gradient border effect */}
        <div
          className={`absolute inset-0 ${heroCardStyles.layout.gradientWrapper} p-[1px]`}
          style={{ background: getHeroGradientCSS() }}
        >
          <div
            className={`absolute inset-[1px] ${heroCardStyles.layout.gradientWrapper}`}
            style={{ backgroundColor: heroCardStyles.surface.oklch }}
          />
        </div>

        {/* Inner glow overlay */}
        <div
          className={`absolute inset-0 ${heroCardStyles.layout.gradientWrapper} pointer-events-none`}
          style={{ background: getHeroGlowCSS() }}
        />

        {/* Content */}
        <div
          className={heroCardStyles.layout.content}
          style={{
            padding: heroCardStyles.padding.mobile,
            minHeight: heroCardStyles.heights.mobile,
          }}
        >
          {/* Header */}
          <div className={heroCardStyles.header.container}>
            <div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={heroCardStyles.header.monthLabel}
              >
                {formatMonth(currentMonth)}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className={heroCardStyles.header.subtitle}
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
          <div className={heroCardStyles.amount.container}>
            <AnimatedCurrency value={totalSpending} />
          </div>

          {/* Budget Progress */}
          {hasBudget && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={heroCardStyles.budgetProgress.container}
            >
              <div className={heroCardStyles.budgetProgress.labelRow}>
                <span className={heroCardStyles.budgetProgress.label}>Budget Progress</span>
                <span className={heroCardStyles.budgetProgress.remaining}>
                  {formatCurrency(budgetRemaining)} left
                </span>
              </div>
              <ProgressBar percentage={budgetProgress * 100} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
