/**
 * Shared component definitions.
 *
 * This module exports:
 * - Component contracts (prop interfaces)
 *
 * Usage:
 * ```typescript
 * import type { BudgetRowProps, EmptyStateProps } from "@somar/shared/components";
 * ```
 *
 * Components themselves are NOT shared - each platform has its own
 * implementation using the appropriate UI toolkit (shadcn/React Native).
 * The contracts ensure both implementations have the same API.
 */

// Re-export all contracts
export * from "./contracts";
