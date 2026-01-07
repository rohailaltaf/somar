/**
 * Spacing scale - single source of truth for layout spacing.
 * Based on a 4px base unit, similar to Tailwind's default scale.
 *
 * Usage:
 *   import { spacing } from "@somar/shared/theme";
 *   style={{ padding: spacing.md, gap: spacing.sm }}
 */
export const spacing = {
  /** 0px */
  none: 0,
  /** 4px - Tight spacing for inline elements */
  xs: 4,
  /** 8px - Compact spacing */
  sm: 8,
  /** 12px - Default gap between elements */
  md: 12,
  /** 16px - Standard padding for cards and sections */
  lg: 16,
  /** 20px - Comfortable padding */
  xl: 20,
  /** 24px - Generous spacing */
  "2xl": 24,
  /** 32px - Section separation */
  "3xl": 32,
  /** 40px - Large section padding */
  "4xl": 40,
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = (typeof spacing)[SpacingKey];
