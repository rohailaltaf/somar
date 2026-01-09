/**
 * Component contracts - shared interface definitions.
 *
 * These interfaces define the props that components should implement
 * on both web and mobile platforms. Using the same contracts ensures
 * consistent APIs and makes it easier to maintain feature parity.
 *
 * Usage:
 * ```typescript
 * import type { BudgetRowProps, EmptyStateProps } from "@somar/shared/components";
 * ```
 */

// Budget/Category row
export type { BudgetRowProps, BudgetRowCategory } from "./budget-row";

// Transaction row
export type {
  TransactionRowProps,
  TransactionRowCompactProps,
} from "./transaction-row";

// Empty state
export type {
  EmptyStateProps,
  TransactionsEmptyStateProps,
  SearchEmptyStateProps,
} from "./empty-state";

// Amount display
export type {
  AmountDisplayProps,
  HeroAmountDisplayProps,
} from "./amount-display";

// Section headers
export type {
  SectionHeaderProps,
  DateSectionHeaderProps,
  DashboardSectionHeaderProps,
  PageHeaderProps,
} from "./section-header";

// Dashboard components
export type { StatCardProps } from "./stat-card";
export type { QuickActionProps } from "./quick-action";
export type { AnimatedCurrencyProps } from "./animated-currency";
