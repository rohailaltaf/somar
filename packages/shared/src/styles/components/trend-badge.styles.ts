/**
 * TrendBadge shared styles.
 * Used by both web and mobile implementations.
 *
 * For spending context: up is bad (destructive), down is good (success)
 */

import { hexColors, extendedHexColors } from "../../theme/colors";

/**
 * Props for TrendBadge component.
 * Identical interface used by both web and mobile.
 */
export interface TrendBadgeProps {
  /** Percentage change - positive means increase, negative means decrease */
  change: number | null;
}

export const trendBadgeStyles = {
  /** Base container styles - inline-flex for web display, flex-row for direction on both */
  container: "inline-flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-full",

  /** Variant backgrounds (for container) - use 15% opacity for subtle effect */
  bg: {
    up: "bg-destructive/15",
    down: "bg-success/15",
    neutral: "bg-muted",
  },

  /** Hex background colors for inline styles (when Tailwind classes don't work) */
  bgHex: {
    up: extendedHexColors.destructiveMuted,
    down: extendedHexColors.successMuted,
    neutral: hexColors.muted,
  },

  /** Variant text colors (for Text components on native) */
  textColor: {
    up: "text-destructive",
    down: "text-success",
    neutral: "text-muted-foreground",
  },

  /** Icon size class */
  icon: "w-3.5 h-3.5",

  /** Icon size in pixels for native */
  iconSize: 14,

  /** Percentage text */
  text: "text-xs font-semibold",

  /** Suffix text (e.g., "vs last mo") - use px for cross-platform (0.65rem = ~10px) */
  suffix: "text-[10px] opacity-70 ml-1",
} as const;

export type TrendDirection = "up" | "down" | "neutral";

/**
 * Get the variant classes based on change value.
 */
export function getTrendVariant(change: number | null): TrendDirection {
  if (change === null || change === 0) return "neutral";
  return change > 0 ? "up" : "down";
}

/**
 * Get container className for a trend direction (includes bg color).
 */
export function getTrendBadgeContainerClass(direction: TrendDirection): string {
  return `${trendBadgeStyles.container} ${trendBadgeStyles.bg[direction]}`;
}

/**
 * Get text className for a trend direction.
 */
export function getTrendBadgeTextClass(direction: TrendDirection): string {
  return `${trendBadgeStyles.text} ${trendBadgeStyles.textColor[direction]}`;
}
