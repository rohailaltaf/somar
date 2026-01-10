/**
 * BudgetRow component contract.
 *
 * This interface defines the props for budget/category row components
 * that display spending progress against a budget.
 *
 * Implemented by:
 * - Web: apps/web/src/components/budget-progress.tsx
 * - Mobile: apps/mobile/src/components/categories/category-row.tsx
 */

/**
 * Minimal category info needed for display.
 * Full Category type has more fields, but these are what we need.
 */
export interface BudgetRowCategory {
  id?: string;
  name: string;
  color: string;
}

/**
 * Props for a budget row component.
 *
 * @example
 * ```tsx
 * // Both platforms use the same props interface
 * <BudgetRow
 *   category={category}
 *   spent={-234.56}
 *   budget={400}
 *   onPress={() => router.push(`/categories/${category.id}`)}
 * />
 * ```
 */
export interface BudgetRowProps {
  /**
   * The category to display.
   * Only name and color are required for rendering.
   */
  category: BudgetRowCategory;

  /**
   * Amount spent in this category.
   * Should be negative for expenses (will be converted to absolute value for display).
   */
  spent: number;

  /**
   * Budget amount for this category.
   * Pass null or 0 if no budget is set.
   */
  budget: number | null;

  /**
   * Called when the row is pressed/clicked.
   * Optional - if not provided, the row won't be interactive.
   */
  onPress?: () => void;

  /**
   * Animation delay index for staggered entrance animations.
   * Used to create sequential reveal effects in lists.
   * @default 0
   */
  index?: number;

  /**
   * Whether to show detailed budget information.
   * When true, shows spent/budget amounts and percentage.
   * @default true
   */
  showDetails?: boolean;
}
