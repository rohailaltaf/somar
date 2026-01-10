/**
 * CategoryRow shared styles.
 * Used by both web and mobile implementations for budget/spending rows.
 */

/**
 * Props for CategoryRow component.
 * Identical interface used by both web and mobile.
 */
export interface CategoryRowProps {
  /** Category name */
  name: string;
  /** Amount spent (should be positive number) */
  amount: number;
  /** Budget amount (null if no budget) */
  budget: number | null;
  /** Category color (hex for mobile, oklch for web converted elsewhere) */
  color: string;
  /** Index for staggered animation */
  index: number;
  /** Whether this is the last item (for border handling) */
  isLast?: boolean;
}

export const categoryRowStyles = {
  /** Main container */
  container: "group",

  /** Row layout - flex for web display, flex-row for direction */
  row: "flex flex-row items-center gap-4",

  /** Category color indicator */
  colorDot: "w-3 h-3 rounded-full flex-shrink-0",

  /** Content area */
  content: "flex-1 min-w-0",

  /** Header row (name + amount) - flex for web display, flex-row for direction */
  header: "flex flex-row items-center justify-between mb-2",

  /** Category name */
  name: "text-foreground-secondary font-medium capitalize truncate",

  /** Amount container - flex for web, flex-row for direction, items-end (baseline not in RN) */
  amountContainer: "flex flex-row items-end gap-2 ml-2",

  /** Spent amount - normal state */
  amount: "font-semibold tabular-nums text-foreground",

  /** Spent amount - over budget state */
  amountOver: "font-semibold tabular-nums text-destructive",

  /** Budget amount suffix */
  budget: "text-xs text-foreground-dim",

  /** Progress bar track */
  progressTrack: "relative h-1.5 bg-surface-elevated rounded-full overflow-hidden",

  /** Progress bar indicator */
  progressBar: "absolute inset-y-0 left-0 rounded-full",

  /** Budget status text container - flex for web display, flex-row for direction */
  statusContainer: "flex flex-row justify-end mt-1",

  /** Budget status text */
  status: "text-[10px] font-medium",

  /** Status color variants */
  statusOver: "text-destructive",
  statusWarning: "text-warning",
  statusNormal: "text-muted-foreground",
} as const;

/**
 * Get amount className based on over-budget state.
 */
export function getCategoryAmountClass(isOverBudget: boolean): string {
  return isOverBudget ? categoryRowStyles.amountOver : categoryRowStyles.amount;
}

/**
 * Get status className based on budget usage.
 */
export function getCategoryStatusClass(budgetUsed: number, isOverBudget: boolean): string {
  if (isOverBudget) return categoryRowStyles.statusOver;
  if (budgetUsed >= 80) return categoryRowStyles.statusWarning;
  return categoryRowStyles.statusNormal;
}
