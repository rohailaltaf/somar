/**
 * AnimatedCurrency component contract.
 *
 * This interface defines the props for animated currency display
 * components used in hero cards to show large monetary values.
 *
 * Implemented by:
 * - Web: apps/web/src/components/dashboard/animated-currency.tsx
 * - Mobile: apps/mobile/src/components/dashboard/animated-currency.tsx
 */

/**
 * Props for an animated currency display component.
 *
 * @example
 * ```tsx
 * <AnimatedCurrency value={1234.56} duration={1500} />
 * ```
 */
export interface AnimatedCurrencyProps {
  /**
   * The monetary value to display.
   * Will be formatted as currency (e.g., $1,234.56).
   */
  value: number;

  /**
   * Animation duration in milliseconds.
   * Controls how long the count-up animation takes.
   * @default 1500
   */
  duration?: number;
}
