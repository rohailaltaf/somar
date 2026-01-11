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
export type { TransactionRowProps } from "./transaction-row";

// Empty state
export type { EmptyStateProps, SearchEmptyStateProps } from "./empty-state";

// Amount display
export type { AmountDisplayProps } from "./amount-display";

// Section headers
export type {
  DateSectionHeaderProps,
  DashboardSectionHeaderProps,
} from "./section-header";

// Dashboard components
export type { StatCardProps } from "./stat-card";
export type { QuickActionProps } from "./quick-action";
export type { AnimatedCurrencyProps } from "./animated-currency";

// Auth components
export type { OtpInputProps } from "./otp-input";
export type { OtpStep, OtpState } from "./auth";
export { initialOtpState } from "./auth";
