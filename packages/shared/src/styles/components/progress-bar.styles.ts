/**
 * ProgressBar shared styles.
 * Used by both web and mobile implementations.
 *
 * Both platforms have animated progress bars with:
 * - Track (background)
 * - Bar (filled portion)
 * - Optional glow effect
 * - Color coding based on percentage thresholds
 */

import { hexColors } from "../../theme/colors";

/**
 * ProgressBar props interface - must be identical on both platforms.
 */
export interface ProgressBarProps {
  /** Progress percentage (0-100, can exceed 100 for over-budget) */
  percentage: number;
}

export const progressBarStyles = {
  /** Track container */
  track: "overflow-hidden rounded-full",
  trackHeight: "h-2",
  trackBackground: "bg-muted",

  /** Progress bar */
  bar: "rounded-full",
  barAbsolute: "absolute inset-y-0 left-0",

  /** Glow layer (for visual depth) */
  glow: "blur-sm opacity-50",

  /** Height variants */
  heights: {
    sm: 6,
    md: 8,
    lg: 10,
  },

  /** Animation timing */
  animation: {
    duration: 1000,
    delay: 300,
    /** Framer Motion / CSS ease curve */
    ease: [0.16, 1, 0.3, 1] as const,
  },
} as const;

/**
 * Color thresholds for progress bars.
 * - Under 80%: primary/gold (safe)
 * - 80-99%: warning (approaching limit)
 * - 100%+: destructive (over budget)
 */
export const progressBarThresholds = {
  warning: 80,
  danger: 100,
} as const;

/**
 * Get color token based on percentage value.
 * Returns semantic color token name.
 */
export function getProgressColorToken(percentage: number): "primary" | "warning" | "destructive" {
  if (percentage >= progressBarThresholds.danger) return "destructive";
  if (percentage >= progressBarThresholds.warning) return "warning";
  return "primary";
}

/**
 * Get Tailwind background class based on percentage.
 */
export function getProgressBarColorClass(percentage: number): string {
  const token = getProgressColorToken(percentage);
  const classMap = {
    primary: "bg-gold",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };
  return classMap[token];
}

/**
 * Get hex color based on percentage.
 * For use in native style props.
 */
export function getProgressBarHexColor(percentage: number): string {
  const token = getProgressColorToken(percentage);
  const colorMap = {
    primary: hexColors.gold,
    warning: hexColors.warning,
    destructive: hexColors.destructive,
  };
  return colorMap[token];
}
