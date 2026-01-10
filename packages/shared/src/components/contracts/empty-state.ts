/**
 * EmptyState component contract.
 *
 * This interface defines the props for empty state components
 * that display a message when there's no data to show.
 *
 * Implemented by:
 * - Web: (inline in various pages)
 * - Mobile: apps/mobile/src/components/ui/empty-state.tsx
 */

/**
 * Props for an empty state component.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="Wallet"
 *   title="No transactions yet"
 *   description="Connect your bank or import transactions to get started."
 *   action={{
 *     label: "Get Started",
 *     onPress: () => router.push("/accounts"),
 *   }}
 * />
 * ```
 */
export interface EmptyStateProps {
  /**
   * Lucide icon name to display.
   * Will be resolved to the appropriate icon component.
   * @example "Wallet", "Search", "FileText", "CreditCard"
   */
  icon: string;

  /**
   * Primary message/title.
   * Should be short and descriptive.
   */
  title: string;

  /**
   * Secondary description text.
   * Provides more context or instructions.
   */
  description: string;

  /**
   * Optional action button.
   * When provided, shows a button below the description.
   */
  action?: {
    /**
     * Button label text.
     */
    label: string;

    /**
     * Navigation href (web) - use for links.
     */
    href?: string;

    /**
     * Called when the button is pressed (mobile or custom handlers).
     */
    onPress?: () => void;

    /**
     * Button variant for styling.
     * @default "default"
     */
    variant?: "default" | "outline" | "ghost";
  };

  /**
   * Size variant for the empty state.
   * @default "default"
   */
  size?: "compact" | "default" | "large";
}

/**
 * Pre-configured empty state for search results.
 */
export interface SearchEmptyStateProps {
  /**
   * The search query that returned no results.
   */
  query: string;

  /**
   * Optional action to clear the search.
   */
  onClear?: () => void;
}
