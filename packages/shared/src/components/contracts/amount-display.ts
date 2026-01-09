/**
 * AmountDisplay component contract.
 *
 * This interface defines the props for amount display components
 * that show monetary values with appropriate formatting and colors.
 *
 * Implemented by:
 * - Web: (inline formatting in various components)
 * - Mobile: apps/mobile/src/components/ui/amount-display.tsx
 */

import type { AmountColorMode } from "../../ui-logic/use-amount-display";

/**
 * Props for an amount display component.
 *
 * @example
 * ```tsx
 * // Expense (shows in red)
 * <AmountDisplay amount={-123.45} showSign />
 *
 * // Income (shows in green)
 * <AmountDisplay amount={500.00} showSign />
 *
 * // Neutral display
 * <AmountDisplay amount={100.00} colorMode="neutral" />
 * ```
 */
export interface AmountDisplayProps {
  /**
   * The monetary amount to display.
   * Negative values are treated as expenses.
   * Positive values are treated as income.
   */
  amount: number;

  /**
   * Whether to show +/- sign before the amount.
   * @default false
   */
  showSign?: boolean;

  /**
   * Whether to show cents (decimal places).
   * @default true
   */
  showCents?: boolean;

  /**
   * Size variant for the text.
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl" | "hero";

  /**
   * Override automatic color detection.
   * - "auto": Red for expenses, green for income
   * - "expense": Always red
   * - "income": Always green
   * - "neutral": Use default foreground color
   * @default "auto"
   */
  colorMode?: AmountColorMode;

  /**
   * Additional CSS class names (web) or style overrides.
   */
  className?: string;
}

/**
 * Props for a hero amount display (large, animated).
 * Used for dashboard spending totals.
 */
export interface HeroAmountDisplayProps {
  /**
   * The monetary amount to display.
   */
  amount: number;

  /**
   * Previous amount for comparison/animation.
   * If provided, will animate from previous to current.
   */
  previousAmount?: number;

  /**
   * Whether to animate the count-up effect.
   * @default true
   */
  animated?: boolean;

  /**
   * Label text shown below the amount.
   * @example "Total Spending", "This Month"
   */
  label?: string;
}
