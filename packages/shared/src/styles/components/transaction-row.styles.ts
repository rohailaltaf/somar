/**
 * TransactionRow shared styles.
 * Used by both web and mobile implementations.
 */

export const transactionRowStyles = {
  /** Main container - flex for web display, flex-row for direction */
  container: "flex flex-row items-center gap-3",

  /** Category color bar */
  colorBar: "w-[3px] h-10 rounded-full flex-shrink-0",

  /** Content area */
  content: "flex-1 min-w-0",

  /** Description text */
  description: "text-sm text-foreground truncate font-medium",

  /** Meta row (date, category) - flex for web display, flex-row for direction */
  meta: "flex flex-row items-center gap-2 mt-0.5",

  /** Date text */
  date: "text-xs text-foreground-dim",

  /** Category name */
  category: "text-xs text-muted-foreground capitalize",

  /** Uncategorized label */
  uncategorized: "text-xs text-primary",

  /** Unconfirmed indicator dot */
  unconfirmedDot: "w-1.5 h-1.5 rounded-full bg-primary animate-pulse",

  /** Amount container */
  amountContainer: "flex-shrink-0",

  /** Amount text */
  amount: "text-sm font-semibold tabular-nums",
} as const;

/**
 * Compact variant for dashboard previews.
 */
export const transactionRowCompactStyles = {
  container: "flex flex-row items-center px-5 py-3.5",
  colorBar: "w-[3px] h-9 rounded mr-3.5",
  description: "text-sm font-medium text-foreground",
  meta: "flex flex-row items-center mt-1",
  date: "text-xs text-muted-foreground",
  category: "text-xs text-muted-foreground ml-1.5 capitalize",
  uncategorized: "text-xs text-primary ml-1.5",
  unconfirmedDot: "w-1.5 h-1.5 rounded-full bg-primary ml-1.5",
  amount: "text-sm font-semibold",
  amountExpense: "text-foreground",
  amountIncome: "text-success",
} as const;
