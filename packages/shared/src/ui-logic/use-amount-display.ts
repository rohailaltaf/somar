/**
 * Amount display calculation hook.
 *
 * Provides all the values needed to display monetary amounts:
 * - Formatted currency string
 * - Sign (+/-)
 * - Color tokens for expense/income styling
 *
 * Used by both web and mobile for consistent amount display.
 */

import { formatCurrency } from "../utils";

export type AmountColorMode = "auto" | "expense" | "income" | "neutral";
export type AmountColorToken = "expense" | "income" | "neutral";

export interface AmountDisplayOptions {
  /** Show +/- sign before amount */
  showSign?: boolean;
  /** Show cents (default: true) */
  showCents?: boolean;
  /** Override automatic color detection */
  colorMode?: AmountColorMode;
}

export interface AmountDisplayResult {
  /** Formatted amount with currency symbol (no sign included) */
  formatted: string;
  /** Sign to display: '-' for expenses, '+' for income, '' for zero/neutral */
  sign: string;
  /** Full display string with sign if requested */
  display: string;
  /** Color token: 'expense' | 'income' | 'neutral' */
  colorToken: AmountColorToken;
  /** Tailwind class for text color */
  colorClass: string;
  /** Whether this is an expense (negative amount) */
  isExpense: boolean;
  /** Whether this is income (positive amount) */
  isIncome: boolean;
  /** Whether amount is zero */
  isZero: boolean;
}

/**
 * Calculate amount display values.
 *
 * @param amount - The monetary amount (negative = expense, positive = income)
 * @param options - Display options
 * @returns Object with all calculated display values
 *
 * @example
 * ```tsx
 * // Web usage
 * const { display, colorClass } = useAmountDisplay(transaction.amount, { showSign: true });
 * <span className={colorClass}>{display}</span>
 *
 * // Mobile usage
 * const { display, colorToken } = useAmountDisplay(amount);
 * <Text style={{ color: hexColors[colorToken === 'expense' ? 'destructive' : 'success'] }}>
 *   {display}
 * </Text>
 * ```
 */
export function useAmountDisplay(
  amount: number,
  options: AmountDisplayOptions = {}
): AmountDisplayResult {
  const { showSign = false, showCents = true, colorMode = "auto" } = options;

  const isExpense = amount < 0;
  const isIncome = amount > 0;
  const isZero = amount === 0;

  // Format the absolute value
  const formatted = formatCurrency(Math.abs(amount), showCents);

  // Determine sign
  let sign = "";
  if (showSign && !isZero) {
    sign = isExpense ? "-" : "+";
  }

  // Build display string
  const display = sign ? `${sign}${formatted}` : formatted;

  // Determine color token based on mode
  let colorToken: AmountColorToken;
  if (colorMode === "neutral" || isZero) {
    colorToken = "neutral";
  } else if (colorMode === "expense") {
    colorToken = "expense";
  } else if (colorMode === "income") {
    colorToken = "income";
  } else {
    // auto mode: negative = expense, positive = income
    colorToken = isExpense ? "expense" : isIncome ? "income" : "neutral";
  }

  // Map color token to Tailwind class - consistent across all pages
  const colorClassMap: Record<AmountColorToken, string> = {
    expense: "text-destructive",
    income: "text-success",
    neutral: "text-foreground",
  };

  return {
    formatted,
    sign,
    display,
    colorToken,
    colorClass: colorClassMap[colorToken],
    isExpense,
    isIncome,
    isZero,
  };
}
