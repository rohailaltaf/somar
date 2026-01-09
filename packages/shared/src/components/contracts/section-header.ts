/**
 * SectionHeader component contracts.
 *
 * These interfaces define props for various section header components
 * used to divide content into logical groups.
 *
 * Implemented by:
 * - Web: apps/web/src/components/page-header.tsx
 * - Mobile: apps/mobile/src/components/ui/section-header.tsx
 */

/**
 * Props for a basic section header.
 *
 * @example
 * ```tsx
 * <SectionHeader
 *   title="Recent Transactions"
 *   action={<Button onClick={viewAll}>View All</Button>}
 * />
 * ```
 */
export interface SectionHeaderProps {
  /**
   * Section title text.
   */
  title: string;

  /**
   * Optional subtitle or description.
   */
  subtitle?: string;

  /**
   * Optional right-side action element.
   * Can be a button, link, or any React node.
   */
  action?: React.ReactNode;

  /**
   * Size variant.
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
}

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

/**
 * Props for a page header.
 * Used at the top of pages with title and optional actions.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Transactions"
 *   description="View and manage all your transactions"
 *   actions={<Button>Export</Button>}
 * />
 * ```
 */
export interface PageHeaderProps {
  /**
   * Page title.
   */
  title: string;

  /**
   * Optional page description.
   */
  description?: string;

  /**
   * Optional action buttons or elements.
   */
  actions?: React.ReactNode;

  /**
   * Whether to show a back button.
   * @default false
   */
  showBack?: boolean;

  /**
   * Called when back button is pressed.
   */
  onBack?: () => void;
}
