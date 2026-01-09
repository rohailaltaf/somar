"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@somar/shared";
import {
  categoryRowStyles,
  getCategoryAmountClass,
  getCategoryStatusClass,
  type CategoryRowProps,
} from "@somar/shared/styles";

/**
 * Category spending row with budget progress visualization.
 * Uses shared styles from @somar/shared/styles.
 */
export function CategoryRow({ name, amount, budget, color, index }: CategoryRowProps) {
  const isOverBudget = budget ? amount > budget : false;
  const budgetUsed = budget ? (amount / budget) * 100 : null;

  const getProgressColor = () => {
    if (isOverBudget) return "var(--destructive)";
    if (budgetUsed && budgetUsed >= 80) return "var(--warning)";
    return color;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.06, duration: 0.5 }}
      className={categoryRowStyles.container}
    >
      <div className={categoryRowStyles.row}>
        {/* Color indicator */}
        <div
          className={categoryRowStyles.colorDot}
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
        />

        {/* Category info */}
        <div className={categoryRowStyles.content}>
          <div className={categoryRowStyles.header}>
            <span className={categoryRowStyles.name}>{name}</span>
            <div className={`flex ${categoryRowStyles.amountContainer}`}>
              <span className={getCategoryAmountClass(isOverBudget)}>
                {formatCurrency(amount)}
              </span>
              {budget && (
                <span className={categoryRowStyles.budget}>
                  / {formatCurrency(budget)}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar - only shown when budget exists */}
          {budget && budgetUsed !== null && (
            <>
              <div className={categoryRowStyles.progressTrack}>
                <motion.div
                  className={categoryRowStyles.progressBar}
                  style={{ backgroundColor: getProgressColor() }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <div className={categoryRowStyles.statusContainer}>
                <span className={`${categoryRowStyles.status} ${getCategoryStatusClass(budgetUsed, isOverBudget)}`}>
                  {budgetUsed.toFixed(0)}% of budget
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
