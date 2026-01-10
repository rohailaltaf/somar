/**
 * Spacing scale - matches Tailwind's spacing utilities exactly.
 *
 * Usage:
 *   import { spacing } from "@somar/shared/theme";
 *   style={{ padding: spacing[4], gap: spacing[3] }}
 *
 * Mapping to Tailwind:
 *   spacing[4]  = 16px = p-4, m-4, gap-4
 *   spacing[6]  = 24px = p-6, m-6, gap-6
 *   spacing[8]  = 32px = p-8, m-8, gap-8
 *
 * Formula: spacing[n] = n * 4px
 */
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

/**
 * Border radius scale - matches Tailwind's rounded-* utilities exactly.
 *
 * Usage:
 *   import { radius } from "@somar/shared/theme";
 *   style={{ borderRadius: radius["2xl"] }}
 *
 * Mapping to Tailwind:
 *   radius.sm     = 2px  = rounded-sm
 *   radius.lg     = 8px  = rounded-lg
 *   radius["2xl"] = 16px = rounded-2xl
 *   radius["3xl"] = 24px = rounded-3xl
 */
export const radius = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
  full: 9999,
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = (typeof spacing)[SpacingKey];
export type RadiusKey = keyof typeof radius;
export type RadiusValue = (typeof radius)[RadiusKey];
