"use client";

import { motion } from "framer-motion";
import { useAmountDisplay } from "@somar/shared/ui-logic";
import { transactionRowStyles } from "@somar/shared/styles";

interface TransactionRowProps {
  description: string;
  amount: number;
  date: string;
  categoryName?: string;
  categoryColor?: string;
  isConfirmed: boolean;
  index: number;
}

/**
 * Transaction list item for dashboard recent activity.
 * Uses shared styles from @somar/shared/styles.
 */
export function TransactionRow({
  description,
  amount,
  date,
  categoryName,
  categoryColor,
  isConfirmed,
  index,
}: TransactionRowProps) {
  const { display, colorClass } = useAmountDisplay(amount, { showSign: true });
  const [, month, day] = date.split("-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.04, duration: 0.4 }}
      className={`group ${transactionRowStyles.container} py-3 px-2 -mx-2 rounded-xl hover:bg-surface-elevated transition-colors cursor-default`}
    >
      {/* Category color bar */}
      <div
        className={transactionRowStyles.colorBar}
        style={{ backgroundColor: categoryColor || "var(--border)" }}
      />

      {/* Transaction details */}
      <div className={transactionRowStyles.content}>
        <p className={transactionRowStyles.description}>{description}</p>
        <div className={transactionRowStyles.meta}>
          <span className={transactionRowStyles.date}>
            {new Date(2024, parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          {categoryName ? (
            <span className={transactionRowStyles.category}>· {categoryName}</span>
          ) : (
            <span className={transactionRowStyles.uncategorized}>· Uncategorized</span>
          )}
          {!isConfirmed && (
            <span className={transactionRowStyles.unconfirmedDot} />
          )}
        </div>
      </div>

      {/* Amount - uses shared hook */}
      <span className={`${transactionRowStyles.amount} ${transactionRowStyles.amountContainer} ${colorClass}`}>
        {display}
      </span>
    </motion.div>
  );
}
