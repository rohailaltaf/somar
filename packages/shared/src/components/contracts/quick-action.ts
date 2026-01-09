/**
 * QuickAction component contract.
 *
 * This interface defines the props for quick action buttons
 * used in dashboard grids for common user actions.
 *
 * Implemented by:
 * - Web: apps/web/src/components/dashboard/quick-action.tsx
 * - Mobile: apps/mobile/src/components/dashboard/quick-action.tsx
 */

/**
 * Props for a quick action button component.
 *
 * @example
 * ```tsx
 * // Web
 * <QuickAction
 *   href="/upload"
 *   icon={Upload}
 *   label="Upload"
 *   sublabel="Import CSV"
 * />
 *
 * // Mobile
 * <QuickAction
 *   onPress={() => router.push("/upload")}
 *   icon={Upload}
 *   label="Upload"
 *   sublabel="Import CSV"
 * />
 * ```
 */
export interface QuickActionProps {
  /**
   * Lucide icon component to display.
   * Pass the component directly (not a string).
   */
  icon: React.ComponentType<{ className?: string; size?: number; color?: string }>;

  /**
   * Primary label text.
   */
  label: string;

  /**
   * Secondary description text.
   */
  sublabel: string;

  /**
   * When true, uses highlighted styling (primary colors).
   * Use for the most important action.
   * @default false
   */
  highlight?: boolean;

  /**
   * Navigation href (web) - use for links.
   */
  href?: string;

  /**
   * Called when the button is pressed (mobile).
   */
  onPress?: () => void;
}
