/**
 * SectionHeader component contracts.
 *
 * These interfaces define props for section header components
 * used to divide content into logical groups.
 *
 * Implemented by:
 * - Web: apps/web/src/components/dashboard/section-header.tsx
 * - Mobile: apps/mobile/src/components/ui/section-header.tsx
 * - Mobile: apps/mobile/src/components/dashboard/section-header.tsx
 */

/**
 * Props for a date-based section header.
 * Used to group transactions by date.
 *
 * @example
 * ```tsx
 * <DateSectionHeader date="2025-01-15" dayTotal={-234.56} />
 * // Renders: "Today" with "January 15" subtitle
 * ```
 */
export interface DateSectionHeaderProps {
  /**
   * Date string in YYYY-MM-DD format.
   */
  date: string;

  /**
   * Optional total amount for this date.
   * Shows formatted amount on the right side.
   */
  dayTotal?: number;

  /**
   * Number of transactions for this date.
   * Can be shown as a badge or count.
   */
  count?: number;
}

/**
 * Props for a dashboard section header.
 * Enhanced version with subtitle and action button.
 *
 * @example
 * ```tsx
 * <DashboardSectionHeader
 *   title="Top Categories"
 *   subtitle="Where your money goes"
 *   actionLabel="View All"
 *   onAction={() => router.push("/categories")}
 * />
 * ```
 */
export interface DashboardSectionHeaderProps {
  /**
   * Section title text.
   */
  title: string;

  /**
   * Subtitle or description text.
   */
  subtitle: string;

  /**
   * Label for the action button.
   */
  actionLabel: string;

  /**
   * Called when the action button is pressed.
   */
  onAction: () => void;
}

