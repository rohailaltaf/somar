/**
 * Budget progress calculation hook.
 *
 * Provides all the calculated values needed to display budget progress:
 * - Percentage used
 * - Status (good/warning/over)
 * - Color tokens for styling
 * - Remaining amount
 *
 * Used by both web's BudgetProgress and mobile's CategoryRow components.
 */

export type BudgetStatus = "good" | "warning" | "over";
export type BudgetColorToken = "primary" | "warning" | "destructive";

export interface BudgetProgressResult {
  /** Percentage of budget used (0-100+, can exceed 100 if over budget) */
  percent: number;
  /** Percentage capped at 100 for progress bar width */
  percentCapped: number;
  /** Amount remaining (negative if over budget) */
  remaining: number;
  /** Budget status: 'good' (<80%), 'warning' (80-99%), 'over' (>=100%) */
  status: BudgetStatus;
  /** Color token to use (maps to theme colors) */
  colorToken: BudgetColorToken;
  /** Whether budget is exceeded */
  isOverBudget: boolean;
  /** Whether approaching budget limit (>=80%) */
  isNearBudget: boolean;
  /** Whether a budget is set */
  hasBudget: boolean;
}

/**
 * Calculate budget progress values.
 *
 * @param spent - Amount spent (can be negative for expenses, will be converted to absolute value)
 * @param budget - Budget amount (null/undefined/0 means no budget)
 * @returns Object with all calculated budget progress values
 *
 * @example
 * ```tsx
 * // Web usage
 * const { percentCapped, colorToken, isOverBudget } = useBudgetProgress(spent, budget);
 * <Progress value={percentCapped} className={`bg-${colorToken}`} />
 *
 * // Mobile usage
 * const { percentCapped, colorToken } = useBudgetProgress(spent, budget);
 * <AnimatedProgressBar value={percentCapped} color={hexColors[colorToken]} />
 * ```
 */
export function useBudgetProgress(
  spent: number,
  budget: number | null | undefined
): BudgetProgressResult {
  // Handle "no budget" case
  const hasBudget = budget !== null && budget !== undefined && budget > 0;

  if (!hasBudget) {
    return {
      percent: 0,
      percentCapped: 0,
      remaining: 0,
      status: "good",
      colorToken: "primary",
      isOverBudget: false,
      isNearBudget: false,
      hasBudget: false,
    };
  }

  // Convert spent to absolute value (expenses are negative)
  const spentAmount = Math.abs(spent);
  const budgetAmount = budget as number;

  const percent = (spentAmount / budgetAmount) * 100;
  const percentCapped = Math.min(percent, 100);
  const remaining = budgetAmount - spentAmount;
  const isOverBudget = spentAmount >= budgetAmount;
  const isNearBudget = percent >= 80;

  let status: BudgetStatus;
  let colorToken: BudgetColorToken;

  if (percent >= 100) {
    status = "over";
    colorToken = "destructive";
  } else if (percent >= 80) {
    status = "warning";
    colorToken = "warning";
  } else {
    status = "good";
    colorToken = "primary";
  }

  return {
    percent,
    percentCapped,
    remaining,
    status,
    colorToken,
    isOverBudget,
    isNearBudget,
    hasBudget,
  };
}
