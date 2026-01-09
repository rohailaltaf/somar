/**
 * TransactionRow component contract.
 *
 * This interface defines the props for transaction row components
 * that display individual transactions in lists.
 *
 * Implemented by:
 * - Web: apps/web/src/app/transactions/transactions-list.tsx (inline)
 * - Mobile: apps/mobile/src/components/transactions/transaction-row.tsx
 */

import type { TransactionWithRelations } from "../../types";

/**
 * Props for a transaction row component.
 *
 * @example
 * ```tsx
 * <TransactionRow
 *   transaction={tx}
 *   onCategoryChange={(categoryId) => updateCategory(tx.id, categoryId)}
 *   onExcludeToggle={() => toggleExcluded(tx.id)}
 *   compact={false}
 * />
 * ```
 */
export interface TransactionRowProps {
  /**
   * The transaction to display.
   * Includes related category and account data.
   */
  transaction: TransactionWithRelations;

  /**
   * Called when the category should be changed.
   * Receives the new category ID (or null to uncategorize).
   */
  onCategoryChange?: (categoryId: string | null) => void;

  /**
   * Called when the exclude toggle is pressed.
   * Excluded transactions are hidden from reports.
   */
  onExcludeToggle?: () => void;

  /**
   * Called when the delete action is triggered.
   * Should show a confirmation dialog before actually deleting.
   */
  onDelete?: () => void;

  /**
   * Called when the row is pressed/clicked.
   * Use for navigation or showing details.
   */
  onPress?: () => void;

  /**
   * Compact mode for dashboard/summary lists.
   * Shows less detail to fit more rows.
   * @default false
   */
  compact?: boolean;

  /**
   * Animation delay index for staggered entrance animations.
   * @default 0
   */
  index?: number;

  /**
   * Whether to show the category indicator/selector.
   * @default true
   */
  showCategory?: boolean;

  /**
   * Whether to show the account name.
   * @default false
   */
  showAccount?: boolean;
}

/**
 * Props for a compact transaction row (dashboard variant).
 */
export interface TransactionRowCompactProps {
  /**
   * The transaction to display.
   */
  transaction: TransactionWithRelations;

  /**
   * Called when the row is pressed.
   */
  onPress?: () => void;

  /**
   * Animation delay index.
   */
  index?: number;
}
