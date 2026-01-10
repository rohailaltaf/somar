/**
 * Shared UI logic hooks.
 *
 * These hooks provide platform-agnostic calculations and formatting
 * for common UI patterns. Both web and mobile use these to ensure
 * consistent behavior and reduce code duplication.
 *
 * Usage:
 * ```typescript
 * import { useBudgetProgress, useAmountDisplay, useDateSection } from "@somar/shared/ui-logic";
 * ```
 */

export {
  useBudgetProgress,
  type BudgetProgressResult,
  type BudgetStatus,
  type BudgetColorToken,
} from "./use-budget-progress";

export {
  useAmountDisplay,
  type AmountDisplayResult,
  type AmountDisplayOptions,
  type AmountColorMode,
  type AmountColorToken,
} from "./use-amount-display";

export {
  useDateSection,
  groupByDate,
  type DateSectionResult,
} from "./use-date-section";
