/**
 * StatCard component contract.
 *
 * This interface defines the props for stat card components
 * used in dashboard bento grids to display key metrics.
 *
 * Implemented by:
 * - Web: apps/web/src/components/dashboard/stat-card.tsx
 * - Mobile: apps/mobile/src/components/dashboard/stat-card.tsx
 */

/**
 * Props for a stat card component.
 *
 * @example
 * ```tsx
 * // Web
 * <StatCard
 *   href="/transactions?filter=unconfirmed"
 *   icon={ListChecks}
 *   iconColorClass="text-primary"
 *   value={12}
 *   label="Uncategorized"
 *   highlight={true}
 * />
 *
 * // Mobile
 * <StatCard
 *   onPress={() => router.push("/transactions")}
 *   icon={ListChecks}
 *   iconColorClass="text-primary"
 *   value={12}
 *   label="Uncategorized"
 *   highlight={true}
 * />
 * ```
 */
export interface StatCardProps {
  /**
   * Lucide icon component to display.
   * Pass the component directly (not a string).
   */
  icon: React.ComponentType<{ className?: string; size?: number; color?: string }>;

  /**
   * Tailwind class for icon color.
   * @example "text-primary", "text-muted-foreground"
   */
  iconColorClass: string;

  /**
   * Tailwind class for icon background.
   * @example "bg-primary/20", "bg-muted"
   */
  iconBgClass?: string;

  /**
   * Numeric value to display prominently.
   */
  value: number;

  /**
   * Label text below the value.
   */
  label: string;

  /**
   * When true, shows animated gradient border and glow effect.
   * Use for important or actionable items.
   * @default false
   */
  highlight?: boolean;

  /**
   * Animation delay offset in seconds (web) or index for staggered animation.
   * @default 0
   */
  delay?: number;

  /**
   * Navigation href (web) - use for links.
   */
  href?: string;

  /**
   * Called when the card is pressed (mobile).
   */
  onPress?: () => void;
}
